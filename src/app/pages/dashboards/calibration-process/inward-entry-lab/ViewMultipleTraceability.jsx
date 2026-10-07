import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import { toast } from 'sonner';

const ViewMultipleTraceability = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { inwardId, instIds } = useParams();
    const caliblocation = searchParams.get("caliblocation") || "Lab";
    const calibacc = searchParams.get("calibacc") || "Nabl";

    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let objectUrl = null;

        const fetchPdf = async () => {
            try {
                const authToken =
                    localStorage.getItem("authToken") ||
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("authToken") ||
                    sessionStorage.getItem("token");

                const headers = {};
                if (authToken) {
                    headers.Authorization = `Bearer ${authToken}`;
                }

                // Using the new endpoint that returns a combined PDF
                const response = await axios.get(
                    `/calibrationprocess/view-tracebility-pdf?inwardid=${inwardId}&instid=${instIds}`,
                    { headers, responseType: 'blob' }
                );

                if (response.status === 200) {
                    const file = new Blob([response.data], { type: 'application/pdf' });
                    objectUrl = URL.createObjectURL(file);
                    setPdfUrl(objectUrl);
                    toast.success(`Certificates loaded successfully`);
                } else {
                    setError('No Certificates found');
                    toast.error('No Certificates found');
                }
            } catch (err) {
                if (err.response?.data && err.response.data instanceof Blob) {
                    try {
                        const text = await err.response.data.text();
                        const json = JSON.parse(text);
                        setError(json.message || 'Error loading Certificates');
                        toast.error(json.message || 'Error loading Certificates');
                    } catch (e) {
                        setError('Error loading Certificates');
                        toast.error('Error loading Certificates', e);
                    }
                } else {
                    setError('Error loading Certificates');
                    toast.error('Error loading Certificates');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (inwardId && instIds) {
            fetchPdf();
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [inwardId, instIds]);

    const handleBack = () => {
        navigate(
            `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="flex h-[60vh] items-center justify-center text-gray-600">
                            <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                            </svg>
                            Loading Traceability Certificates...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !pdfUrl) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#dc2626', fontSize: '18px', marginBottom: '16px' }}>
                        {error || 'No Certificates to display'}
                    </p>
                    <button
                        onClick={handleBack}
                        style={{
                            padding: '8px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff'
        }}>
            {/* Action Buttons */}
            <div className="no-print" style={{
                backgroundColor: 'white',
                borderBottom: '2px solid #e5e7eb',
                padding: '12px 24px',
                display: 'flex',
                gap: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                zIndex: 10
            }}>
                <button
                    onClick={handleBack}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                    ← Back to perform calibration
                </button>
            </div>

            {/* PDF Content */}
            <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
                <iframe
                    src={pdfUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                    }}
                    title="Combined Traceability Certificates"
                />
            </div>
            <style>
                {`
                    body {
                        margin: 0;
                        padding: 0;
                    }
                `}
            </style>
        </div>
    );
};

export default ViewMultipleTraceability;