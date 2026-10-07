import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";

export default function ViewCertificate() {
  const { id: inwardId, itemId: instId } = useParams();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(
          `/calibrationprocess/view-certificate?inwardid=${inwardId}&instid=${instId}&caliblocation=Lab&calibacc=Nabl`
        );
        setHtml(response.data); // API returns HTML string
      } catch (error) {
        console.error("Error fetching certificate:", error);
        toast.error("Failed to fetch certificate");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [inwardId, instId]);

  // ✅ Print handler
  const handlePrint = () => {
    setPrintLoading(true);
    try {
      const printWindow = window.open("", "_blank", "width=900,height=650");
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                padding: 0;
              }
              .certificate-container { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Print failed");
    } finally {
      setTimeout(() => setPrintLoading(false), 1500);
    }
  };

  if (loading)
    return (
      <Page title="Certificate">
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
          Loading Certificate...
        </div>
      </Page>
    );

  return (
    <Page title="Certificate">
      {/* Container for Certificate and Button - Side by Side */}
      <div className="flex gap-6 items-start">
        {/* Certificate Content */}
        <div className="flex-1">
          <div className="certificate-container">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>

        {/* Print Button - Right Side */}
        <div className="flex-shrink-0 sticky top-4">
          <Button
            onClick={handlePrint}
            color="success"
            disabled={printLoading}
            className="px-6 py-3 text-sm font-medium rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
            style={{
              minWidth: '160px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {printLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Preparing...
              </>
            ) : (
              <>
                {/* Download Icon */}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download CRF
              </>
            )}
          </Button>
        </div>
      </div>
    </Page>
  );
}

