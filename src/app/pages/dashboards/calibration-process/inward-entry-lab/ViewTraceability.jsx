import { useParams, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import { JWT_HOST_API } from "configs/auth.config";

export default function ViewTraceability() {
  const { id: inwardId, itemId: instId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  const [pdfLinks, setPdfLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const token = localStorage.getItem("token");

  // 🔄 Fetch Traceability Data
  const fetchTraceability = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${JWT_HOST_API}/calibrationprocess/view-tracebility?inwardid=${inwardId}&instid=${instId}`,
           {
          
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", 
          },
        }
      );

      if (response.data?.status && Array.isArray(response.data.data)) {
        setPdfLinks(response.data.data);

        // ✅ Auto-open first PDF
        if (response.data.data.length > 0) {
          setTimeout(() => {
            window.open(response.data.data[0], "_blank", "noopener,noreferrer");
          }, 1000);
        }
      } else {
        throw new Error("No traceability data received");
      }
    } catch (err) {
      console.error("Traceability fetch error:", err);
      const message =
        err.response?.status === 404
          ? "Traceability not found"
          : err.response?.status === 500
          ? "Server error"
          : err.code === "ECONNABORTED"
          ? "Request timeout"
          : "Failed to fetch traceability data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inwardId && instId) {
      fetchTraceability();
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
  }, [inwardId, instId]);

  const handleBack = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
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
          Loading Traceability PDFs...
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
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Traceability Loading Failed
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={fetchTraceability} color="primary">
                🔄 Retry
              </Button>
              <Button onClick={handleBack} color="secondary">
                ← Back
              </Button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // ✅ Success State
  return (
    <Page title="View Traceability PDFs">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-blue-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Traceability Certificates
              </h1>
              <p className="text-sm text-gray-600">
                Inward ID: <strong>{inwardId}</strong> | Instrument ID:{" "}
                <strong>{instId}</strong>
              </p>
            </div>
            <Button onClick={handleBack} color="primary" size="sm">
              ← Back
            </Button>
          </div>
        </div>

        {/* PDF Links */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              📜 Available Traceability PDFs
            </h2>

            {pdfLinks.map((link, index) => (
              <div
                key={index}
                className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white flex justify-between items-center hover:scale-[1.02] transition-all duration-200"
              >
                <span>📄 PDF {index + 1}</span>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-yellow-300"
                >
                  Open ↗️
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
