import { useParams, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function RegenerateCacheCopy() {
  const { id: inwardId, itemId: instId } = useParams();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const regenerateCacheCopy = async () => {
      try {
        const response = await axios.post(
          `/calibrationprocess/Regenerate-Cache-Copy`,
          {
            inwardid: inwardId,
            instid: instId,
          }
        );

        if (response.data && response.data.certificate) {
          // Replace single slashes in the path with double slashes (//) to bypass cache
          // (matching any slash not preceded by : or / to preserve https://)
          const bypassedUrl = response.data.certificate.replace(new RegExp("([^:/])/", "g"), "$1//");
          
          window.open(bypassedUrl, "_blank", "noopener,noreferrer");
        } else {
          toast.error(response.data?.message || "Certificate URL not found");
        }

         setTimeout(() => {
          const searchParams = location.search || "?caliblocation=Lab&calibacc=Nabl";
          navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}${searchParams}`);
        }, 5000);

      } catch (error) {
        console.error("Error regenerating cache copy:", error);
        toast.error("Failed to regenerate cache copy");
      } finally {
        setLoading(false);
      }
    };

    regenerateCacheCopy();
  }, [inwardId, instId, location.search, navigate]);

  if (loading) {
    return (
      <Page title="Cache Copy">
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
          Loading Regenrate Cache Copy...
        </div>
      </Page>
    );
  }

  // return (
  //   <Page title="Cache Copy">
  //     {/* <div className="flex h-[60vh] items-center justify-center text-green-600 text-lg font-semibold">
  //       ✅ Certificate opened in a new tab!
  //     </div> */}
  //   </Page>
  // );
}










