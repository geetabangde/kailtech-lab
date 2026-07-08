// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// =============================================================================
// ViewTestDocuments Page
// PHP: viewTestItemDocuments.php?hakuna={trfs_id}&matata={trfproducts_id}&testeventdata_id={teid}
// Route: /dashboards/action-items/test-documents/:trfid/:tid/:teid
//
// PHP Logic:
//   → DataTable AJAX to testItemImages.php
//      params: hakuna={trfs_id}, matata={trfproducts_id}, testeventdata_id={teid}
//   → Shows: id, name, Action (view/delete)
//
// APIs:
//   GET    /actionitem/view-test-document?trfid=&trfproducts_id=&testeventdata_id=
//   DELETE /actionitem/delete-test-document?id=
//
// API Response fields (actual):
//   id       → document id
//   preview  → thumbnail image URL (pdf icon or image preview)
//   file     → file URL
//   view     → view URL (open in browser)
//   download → download URL
// =============================================================================

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
    </svg>
  );
}

export default function ViewTestDocuments() {
  const { trfid, tid, teid } = useParams();
  const navigate = useNavigate();

  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");

  // ── Fetch documents ──────────────────────────────────────────────────────────
  // PHP: DataTable AJAX → testItemImages.php?hakuna={trfs_id}&matata={trfproducts_id}&testeventdata_id={teid}
  // API: GET /actionitem/view-test-document?trfid=&trfproducts_id=&testeventdata_id=
  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/actionitem/view-test-document", {
        params: {
          trfid,
          trfproducts_id: tid,
          testeventdata_id: teid,
        },
      });
      const d = res.data?.data ?? res.data ?? [];
      setDocs(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error("Error loading documents:", err);
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [trfid, tid, teid]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ── Delete document ──────────────────────────────────────────────────────────
  // API: DELETE /actionitem/delete-test-document?id=
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

  // ── Filter by search — search on id only (no name field in API) ─────────────
  const filtered = docs.filter((d) =>
    String(d.id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="View Test Document">
      <div className="transition-content w-full pb-10 px-[var(--margin-x)]">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
            View Test Document
          </h2>
          {/* PHP: Back → performtest.php?hakuna={trfproducts_id} */}
          <button
            onClick={() => navigate(`/dashboards/action-items/perform-testing/${tid}`)}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          >
            ← Back
          </button>
        </div>

        <Card className="overflow-hidden">
          {/* Search */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Loading..." : `${filtered.length} document(s)`}
            </span>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID..."
                className="rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
          </div>

          {/* Table — PHP: columns: id, name(preview), Action */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
              <Spinner /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No documents found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                      ID
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                      Preview
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      {/* ID */}
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {doc.id}
                      </td>

                      {/* Preview — API: doc.preview (thumbnail image URL) */}
                      <td className="px-5 py-3">
                        {doc.preview ? (
                          <img
                            src={doc.preview}
                            alt={`Document ${doc.id}`}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Action — View + Download + Delete */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {/* View — API: doc.view */}
                          {doc.view && (
                            <a
                              href={doc.view}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600"
                            >
                              View
                            </a>
                          )}
                          {/* Download — API: doc.download */}
                          {doc.download && (
                            <a
                              href={doc.download}
                              download
                              className="rounded bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
                            >
                              Download
                            </a>
                          )}
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleting === doc.id}
                            className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                          >
                            {deleting === doc.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}