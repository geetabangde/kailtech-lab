import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { JWT_HOST_API } from "configs/auth.config";

export default function ViewCertificateWithlh() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pdfUrls, setPdfUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const inwardId = params.id || params.inwardId;
  const instIds = params.itemId || params.instId || params.instIds;

  const searchParams = new URLSearchParams(location.search);
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  const getInstrumentIds = () => {
    if (!instIds) return [];
    if (instIds.includes(",")) {
      return instIds.split(",").map((id) => id.trim()).filter((id) => id);
    }
    return [instIds.trim()].filter((id) => id);
  };

  useEffect(() => {
    const fetchCertificatePDFs = async () => {
      try {
        setLoading(true);
        setError("");

        const instIdsArray = getInstrumentIds();

        if (!inwardId || instIdsArray.length === 0) {
          setError("Missing parameters.");
          setLoading(false);
          return;
        }

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("token");

        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }

        const instIdsParam = instIdsArray.join(",");
        const apiUrl = `${JWT_HOST_API}/calibrationprocess/view-multipleapproved?inwardid=${inwardId}&instid=${encodeURIComponent(
          instIdsParam
        )}&caliblocation=${caliblocation}&calibacc=${calibacc}`;

        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        });

        if (response.data?.status && response.data?.data?.length > 0) {
          setPdfUrls(response.data.data);
        } else {
          setError("No certificates found.");
        }
      } catch {
        setError("Failed to load certificates.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificatePDFs();
  }, [inwardId, instIds, caliblocation, calibacc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
              Loading View Multiple Approve Certificate...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || pdfUrls.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded  text-white bg-indigo-500 hover:bg-fuchsia-500"
        >
          ← Back to Perform Calibration
        </button>
        <p className="text-red-600">{error || "No certificates found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded text-white bg-indigo-500 hover:bg-fuchsia-500"
          >
            ← Back to Perform Calibration
          </button>
        </div>

        {/* Show PDF without black background or tools */}
        {pdfUrls.map((url, index) => (
          <div key={index} className="bg-white shadow border rounded-lg mb-6">
            <iframe
              src={`${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full"
              style={{ height: "100vh", border: "none" }}
              title={`Certificate ${index + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
