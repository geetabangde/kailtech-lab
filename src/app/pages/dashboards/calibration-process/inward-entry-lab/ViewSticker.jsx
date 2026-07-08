import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { JWT_HOST_API } from "configs/auth.config";

function ViewSticker() {
    const navigate = useNavigate();
    const location = useLocation();
    const { inwardId, instId } = useParams();

    const [stickersData, setStickersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Extract other parameters from location state
    const caliblocation = location.state?.caliblocation || "Lab";
    const calibacc = location.state?.calibacc || "Nabl";

    // Function to get auth token from localStorage or wherever you store it
    const getAuthToken = () => {
        const token = localStorage.getItem('token') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('access_token') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('authToken');
        return token;
    };

    // API call to fetch sticker data for multiple instruments
    useEffect(() => {
        const fetchStickersData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = getAuthToken();

                if (!token) {
                    setError('Authentication token not found. Please login again.');
                    setLoading(false);
                    return;
                }

                // Split instId into array of IDs
                const instIds = instId.split(',').map(id => id.trim());

                const headers = {
                    'Content-Type': 'application/json',
                };

                if (token.startsWith('Bearer ')) {
                    headers['Authorization'] = token;
                } else {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                // Fetch sticker data for each instrument
                const promises = instIds.map(async (id) => {
                    console.log('Making API call for instId:', id);

                    const response = await fetch(
                        `${JWT_HOST_API}/calibrationprocess/view-sticker`,
                        {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({
                                inwardid: inwardId,
                                instid: id
                            }),
                        }
                    );

                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error('Authentication failed. Please login again.');
                        }
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.status === "true" || result.status === true) {
                        return result.data;
                    } else {
                        throw new Error(result.message || 'Failed to fetch sticker data');
                    }
                });

                const results = await Promise.all(promises);
                setStickersData(results);

            } catch (err) {
                console.error('API Error:', err);
                setError(`Network error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (inwardId && instId) {
            fetchStickersData();
        } else {
            setError('Missing required parameters (inwardId and instId)');
            setLoading(false);
        }
    }, [inwardId, instId]);

    const handleBack = () => {
        navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}`, {
            state: {
                caliblocation,
                calibacc
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        if (typeof dateString === 'string' && dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                    return dateString;
                }
                if (parts[1].length <= 2 && parts[0].length <= 2 && parts[2].length === 4) {
                    return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
                }
            }
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const StickerCard = ({ stickerData }) => {
        const instrument = stickerData?.instruments?.[0];
        const companyInfo = stickerData?.company_info?.[0];

        return (
            <div
                className="bg-white border-2 border-black p-4"
                style={{
                    fontFamily: 'Times New Roman, serif',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    width: '100%',
                    height: '100%'
                }}
            >
                {/* Company Header */}
                <div className="text-center mb-3">
                    <div className="flex items-start justify-center mb-2">
                        <div className="mr-2">
                            <div className="w-12 h-12 bg-gray-200 border border-gray-400 flex items-center justify-center">
                                {companyInfo?.logo ? (
                                    <img
                                        src={companyInfo.logo}
                                        alt="Company Logo"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-[8px] text-center">
                                        <div className="font-bold">ktrc</div>
                                        <div className="text-[6px]">Quality Test</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-left flex-1">
                            <h1 className="text-sm font-bold leading-tight">
                                {companyInfo?.name || 'Kailtech Test And Research Centre Pvt. Ltd.'}
                            </h1>
                        </div>
                    </div>

                    <div className="text-[8px] text-center mb-2 leading-tight">
                        {companyInfo?.address || 'Plot No.141-C, Electronic Complex, Industrial Area, Indore-452010 (MADHYA PRADESH) India'}<br />
                        {companyInfo?.phone || 'Ph: 91-731-4787555 (30 lines)'}
                    </div>

                    <div className="border-t-2 border-b-2 border-black py-2 mb-3">
                        <h2 className="text-sm font-bold">Calibration Status Tag</h2>
                    </div>
                </div>

                {/* Instrument Details */}
                <div className="space-y-1 text-[10px]">
                    <div className="flex items-start">
                        <span className="font-bold min-w-[70px] text-[9px]">Inst. Name:</span>
                        <span className="ml-1">- {instrument?.name || 'N/A'}</span>
                    </div>

                    <div className="flex items-start">
                        <span className="font-bold min-w-[70px] text-[9px]">Location:</span>
                        <span className="ml-1">- {instrument?.instlocation || 'N/A'}</span>
                    </div>

                    <div className="flex items-start">
                        <span className="font-bold min-w-[70px] text-[9px]">ID/Sr:</span>
                        <span className="ml-1">
                            - {instrument?.idno && instrument?.idno !== 'NA' ? instrument.idno : 'N/A'}/
                            {instrument?.serialno && instrument?.serialno !== 'NA' ? instrument.serialno : 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-start">
                        <span className="font-bold min-w-[70px] text-[9px]">BRN No:</span>
                        <span className="ml-1">- {instrument?.bookingrefno || 'N/A'}</span>
                    </div>

                    <div className="flex items-start">
                        <span className="font-bold min-w-[70px] text-[9px]">Cal. Date:</span>
                        <span className="ml-1">- {formatDate(instrument?.calibratedon)}</span>
                    </div>

                    <div className="flex items-start">
                        <span className="font-bold min-w-[70px] text-[9px]">Due Date:</span>
                        <span className="ml-1">- {formatDate(instrument?.duedate)}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-gray-600">
                <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                </svg>
                Loading ViewStickers...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-gray-800">View Stickers</h1>
                        <button
                            onClick={handleBack}
                            className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            ← Back to Perform Calibration
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-700">{error}</p>
                            {error.includes('Authentication') && (
                                <p className="text-red-600 mt-2 text-sm">
                                    Please check if you are logged in and try again.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section - Sticky at top */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        View Stickers ({stickersData.length})
                    </h1>
                    <button
                        onClick={handleBack}
                        className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        ← Back to Perform Calibration
                    </button>
                </div>
            </div>

            {/* Stickers Grid */}
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stickersData.map((stickerData, index) => (
                            <div key={index} className="w-full h-[400px]">
                                <StickerCard stickerData={stickerData} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewSticker;