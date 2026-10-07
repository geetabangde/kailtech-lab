import { useParams, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import {
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function ViewTraceability() {
  const { id: inwardId, itemId: instId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  const [pdfLinks, setPdfLinks] = useState([]);
  const [notFound, setNotFound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authToken =
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token");

  // Helper to extract valid PDF URL whether item is string or object
  const getFileUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.file || item.url || item.path || "";
  };

  // 🔄 Fetch Traceability Data
  const fetchTraceability = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios.post(
        `/calibrationprocess/view-tracebility?inwardid=${inwardId}&instid=${instId}`,
        {},
        { headers }
      );

      if (response.data?.status && Array.isArray(response.data.data)) {
        setPdfLinks(response.data.data);
        if (Array.isArray(response.data.notfound)) {
          setNotFound(response.data.notfound);
        }
      } else {
        throw new Error(response.data?.message || "No traceability data received");
      }
    } catch (err) {
      console.error("Traceability fetch error:", err);
      const message =
        err.response?.data?.message ||
        (err.response?.status === 404
          ? "Traceability not found"
          : err.response?.status === 500
          ? "Server error"
          : err.code === "ECONNABORTED"
          ? "Request timeout"
          : "Failed to fetch traceability data");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inwardId && instId && instId !== "[object Object]") {
      fetchTraceability();
    } else {
      setError("Missing or invalid instrument parameters");
      setLoading(false);
    }
  }, [inwardId, instId]);

  const handleBack = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handleOpenAll = () => {
    const urls = pdfLinks.map(getFileUrl).filter(Boolean);
    if (urls.length === 0) {
      toast.error("No valid certificate URLs found");
      return;
    }
    urls.forEach((url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  const handleOpenCombinedPDF = async () => {
    try {
      const loadingToast = toast.loading("Generating combined PDF...");
      
      const headers = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios.get(
        `/calibrationprocess/view-tracebility-pdf?inwardid=${inwardId}&instid=${instId}`,
        {
          headers,
          responseType: "blob"
        }
      );
      
      toast.dismiss(loadingToast);

      if (response.status === 200) {
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank");
      }
    } catch (error) {
      toast.dismiss();
      if (error.response?.data && error.response.data instanceof Blob) {
          try {
              const text = await error.response.data.text();
              const json = JSON.parse(text);
              toast.error(json.message || "Failed to open combined PDF");
          } catch (e) {
              toast.error("Failed to open combined PDF",e);
          }
      } else {
          toast.error(error.response?.data?.message || "Failed to open combined PDF");
      }
    }
  };

  // ⏳ Loading State
  if (loading)
    return (
      <Page title="View Traceability">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="animate-spin h-6 w-6 mr-2 text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            ></path>
          </svg>
          Loading Traceability Certificates...
        </div>
      </Page>
    );

  // ⚠️ Error State
  if (error) {
    return (
      <Page title="Traceability - Error">
        <div className="flex h-[60vh] items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
          <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-lg border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Traceability Loading Failed
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={fetchTraceability} color="primary" className="flex items-center gap-1.5">
                <ArrowPathIcon className="w-4 h-4" />
                Retry
              </Button>
              <Button onClick={handleBack} color="secondary" className="flex items-center gap-1.5">
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // ✅ Success State
  return (
    <Page title="View Traceability Certificates">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pb-12">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Traceability Certificates
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Inward ID: <span className="font-semibold text-gray-700">{inwardId}</span> | Instrument ID:{" "}
                <span className="font-semibold text-gray-700">{instId}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {pdfLinks.length > 1 && (
                <Button
                  onClick={handleOpenAll}
                  color="primary"
                  variant="outlined"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Open All ({pdfLinks.length})
                </Button>
              )}
              {pdfLinks.length > 0 && (
                <Button
                  onClick={handleOpenCombinedPDF}
                  color="primary"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Open combined PDF
                </Button>
              )}
              <Button onClick={handleBack} color="secondary" size="sm" className="flex items-center gap-1.5">
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Certificates List */}
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Missing / Not Found Alert if any */}
          {notFound.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <div className="font-semibold flex items-center gap-2 mb-1">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                Certificates Not Found for Master Equipment:
              </div>
              <ul className="list-disc list-inside space-y-0.5 ml-2 text-amber-700">
                {notFound.map((item, idx) => (
                  <li key={idx}>
                    {typeof item === "object"
                      ? item?.name || item?.idno || JSON.stringify(item)
                      : String(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>Available Traceability Certificates</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {pdfLinks.length}
                </span>
              </h2>
            </div>

            {pdfLinks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-gray-600">No traceability certificates available</p>
                <p className="text-sm text-gray-400 mt-1">No certificate records found for this instrument.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pdfLinks.map((item, index) => {
                  const fileUrl = getFileUrl(item);
                  const isObject = typeof item === "object" && item !== null;
                  const name =
                    isObject && item.name
                      ? item.name
                      : `Traceability Certificate ${index + 1}`;
                  const idno = isObject ? item.idno : null;
                  const certificateno = isObject ? item.certificateno : null;
                  const serialno = isObject ? item.serialno : null;
                  const enddate = isObject ? item.enddate : null;
                  const type = isObject ? item.type || "pdf" : "pdf";

                  return (
                    <div
                      key={item?.id || index}
                      className="p-5 rounded-xl border border-gray-200 hover:border-blue-300 bg-gray-50/50 hover:bg-blue-50/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg flex-shrink-0 mt-0.5">
                          <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900">
                              {name}
                            </h3>
                            {type && (
                              <span className="px-2 py-0.5 text-xs font-bold uppercase bg-blue-100 text-blue-700 rounded">
                                {type}
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5 text-sm">
                            {idno && (
                              <div>
                                <span className="text-gray-400 font-medium">ID No:</span>{" "}
                                <span className="font-semibold text-gray-800">{idno}</span>
                              </div>
                            )}
                            {certificateno && (
                              <div>
                                <span className="text-gray-400 font-medium">Cert No:</span>{" "}
                                <span className="font-semibold text-gray-800">{certificateno}</span>
                              </div>
                            )}
                            {serialno && (
                              <div>
                                <span className="text-gray-400 font-medium">Serial No:</span>{" "}
                                <span className="font-semibold text-gray-800">{serialno}</span>
                              </div>
                            )}
                            {enddate && (
                              <div>
                                <span className="text-gray-400 font-medium">Valid Till:</span>{" "}
                                <span className="font-semibold text-gray-800">{enddate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            <span>Open PDF</span>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                          >
                            No Link
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
