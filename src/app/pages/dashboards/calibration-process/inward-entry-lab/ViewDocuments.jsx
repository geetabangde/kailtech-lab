
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, Eye, Trash2 } from 'lucide-react';
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";

const API_BASE_URL = `${JWT_HOST_API}/calibrationprocess`;

const ViewDocuments = () => {
    const navigate = useNavigate();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    
    // Extract inwardid and itemid from URL
    const pathname = window.location.pathname;
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    
    const viewDocsIndex = pathSegments.findIndex(seg => seg === 'view-documents');
    const inwardId = viewDocsIndex !== -1 ? pathSegments[viewDocsIndex + 1] : null;
    const itemId = viewDocsIndex !== -1 ? pathSegments[viewDocsIndex + 2] : null;
    
    const searchParams = new URLSearchParams(window.location.search);
    const caliblocation = searchParams.get("caliblocation") || "Lab";
    const calibacc = searchParams.get("calibacc") || "Nabl";

    console.log('Extracted IDs:', { inwardId, itemId, caliblocation, calibacc });

    const getAuthToken = () => {
        const tokenKeys = ['token', 'authToken', 'auth_token', 'accessToken'];
        for (const key of tokenKeys) {
            let token = window.localStorage.getItem(key);
            if (token) return token;
            token = window.sessionStorage.getItem(key);
            if (token) return token;
        }
        return null;
    };

    const getAuthHeaders = (token) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    useEffect(() => {
        if (inwardId && itemId) {
            fetchDocuments();
        } else {
            setLoading(false);
            toast.error('Invalid URL: Missing inwardid or itemid');
        }
    }, [inwardId, itemId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            
            if (!token) {
                toast.error('Authentication token not found. Please login again');
                setLoading(false);
                return;
            }

            const headers = getAuthHeaders(token);
            const apiUrl = `${API_BASE_URL}/get-calibration-documents?inwardid=${inwardId}&itemid=${itemId}`;

            console.log('Fetching documents from:', apiUrl);

            const response = await axios.get(apiUrl, { headers });

            console.log('API Response:', response.data);

            if (response.data.status === true && response.data.data) {
                setDocuments(response.data.data);
                if (response.data.data.length === 0) {
                    toast.info('No documents found');
                } else {
                    toast.success(`Loaded ${response.data.data.length} documents`);
                }
            } else {
                toast.error('Failed to fetch documents');
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            
            if (error.response) {
                const errorMsg = error.response.data.message || error.response.data.error || 'Failed to fetch documents';
                toast.error(`API Error: ${error.response.status} - ${errorMsg}`);
            } else if (error.request) {
                toast.error('Network error: Unable to reach the server');
            } else {
                toast.error(`Error: ${error.message}`);
            }
            
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (document) => {
        setDocumentToDelete(document);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDocumentToDelete(null);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;

        try {
            const token = getAuthToken();
            
            if (!token) {
                toast.error('Authentication token not found. Please login again');
                closeDeleteModal();
                return;
            }

            const headers = getAuthHeaders(token);
            const deleteUrl = `${API_BASE_URL}/delete-calibration-document?id=${documentToDelete.raw_data.id}`;
            
            console.log('Deleting document:', deleteUrl);

            // Optimistically remove from UI
            setDocuments(prevDocs => prevDocs.filter(doc => doc.raw_data.id !== documentToDelete.raw_data.id));
            closeDeleteModal();
            
            toast.promise(
                axios.delete(deleteUrl, { headers }),
                {
                    loading: 'Deleting document...',
                    success: (response) => {
                        if (response.data.status === true || response.data.status === "true") {
                            return 'Document deleted successfully';
                        } else {
                            fetchDocuments();
                            throw new Error(response.data.message || 'Failed to delete document');
                        }
                    },
                    error: (error) => {
                        fetchDocuments();
                        const errorMsg = error.response?.data?.message || 'Failed to delete document';
                        return `Deletion Error: ${errorMsg}`;
                    }
                }
            );
        } catch (error) {
            console.error('Error deleting document:', error);
            fetchDocuments();
            closeDeleteModal();
        }
    };

    const handleView = (document) => {
        if (document.file && document.file.url) {
            window.open(document.file.url, '_blank');
        } else {
            toast.error('Document URL not available');
        }
    };

    // const handleDownload = async (document) => {
    //     try {
    //         if (!document.file || !document.file.url) {
    //             toast.error('Document URL not available');
    //             return;
    //         }

    //         const fileName = document.file.url.split('/').pop();
            
    //         toast.promise(
    //             fetch(document.file.url).then(async (response) => {
    //                 const blob = await response.blob();
    //                 const url = window.URL.createObjectURL(blob);
    //                 const link = document.createElement('a');
    //                 link.href = url;
    //                 link.download = fileName;
    //                 document.body.appendChild(link);
    //                 link.click();
    //                 document.body.removeChild(link);
    //                 window.URL.revokeObjectURL(url);
    //             }),
    //             {
    //                 loading: 'Starting download...',
    //                 success: 'Download completed',
    //                 error: 'Failed to download document'
    //             }
    //         );
    //     } catch (error) {
    //         console.error('Error downloading document:', error);
    //         toast.error('Failed to download document');
    //     }
    // };
// const handleDownload = async (doc) => {
//     try {
//         if (!doc.file || !doc.file.url) {
//             toast.error('Document URL not available');
//             return;
//         }

//         // Extract filename from URL or use raw_data.name if available
//         const fileName = doc.raw_data?.name 
//             ? `${doc.raw_data.name}.${doc.file.url.split('.').pop()}`
//             : doc.file.url.split('/').pop();
        
//         toast.promise(
//             fetch(doc.file.url).then(async (response) => {
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch document');
//                 }
                
//                 const blob = await response.blob();
//                 const url = window.URL.createObjectURL(blob);
//                 const link = document.createElement('a');
//                 link.href = url;
//                 link.download = fileName;
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//                 window.URL.revokeObjectURL(url);
//             }),
//             {
//                 loading: 'Starting download...',
//                 success: 'Download completed',
//                 error: 'Failed to download document'
//             }
//         );
//     } catch (error) {
//         console.error('Error downloading document:', error);
//         toast.error('Failed to download document');
//     }
// };
// const handleDownload = async (doc) => {
//     try {
//         if (!doc.file || !doc.file.url) {
//             toast.error('Document URL not available');
//             return;
//         }

//         // Extract filename
//         const fileName = doc.raw_data?.name 
//             ? `${doc.raw_data.name}.${doc.file.url.split('.').pop()}`
//             : doc.file.url.split('/').pop();
        
//         toast.loading('Starting download...');
        
//         // Create invisible link and trigger download
//         const link = document.createElement('a');
//         link.href = doc.file.url;
//         link.download = fileName;
//         link.target = '_blank'; // Fallback for some browsers
//         link.rel = 'noopener noreferrer';
        
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
        
//         // Small delay then success toast
//         setTimeout(() => {
//             toast.dismiss();
//             toast.success('Download started');
//         }, 500);
        
//     } catch (error) {
//         console.error('Error downloading document:', error);
//         toast.error('Failed to download document');
//     }
// };    
// const handleDownload = async (doc) => {
//     try {
//         if (!doc.file || !doc.file.url) {
//             toast.error('Document URL not available');
//             return;
//         }

//         // Extract filename
//         const fileName = doc.raw_data?.name 
//             ? `${doc.raw_data.name}.${doc.file.url.split('.').pop()}`
//             : doc.file.url.split('/').pop();
        
//        // const loadingToast = toast.loading('Starting download...');
        
//         // Fetch the file as a blob
//         const response = await fetch(doc.file.url);
        
//         if (!response.ok) {
//             throw new Error('Download failed');
//         }
        
//         const blob = await response.blob();
        
//         // Create object URL and trigger download
//         const blobUrl = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = blobUrl;
//         link.download = fileName;
        
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
        
//         // Clean up the blob URL
//         window.URL.revokeObjectURL(blobUrl);
        
//       //  toast.dismiss(loadingToast);
//         toast.success('Download completed');
        
//     } catch (error) {
//         console.error('Error downloading document:', error);
//         toast.error('Failed to download document');
//     }
// };



const handleDownload = async (doc) => {
  try {
    if (!doc.file || !doc.file.url) {
      toast.error("Document URL not available");
      return;
    }

    const fileExtension = doc.file.url.split(".").pop().toLowerCase();
    const fileName = doc.raw_data?.name
      ? `${doc.raw_data.name}.${fileExtension}`
      : doc.file.url.split("/").pop();

    const loadingToast = toast.loading("Preparing download...");

    const response = await fetch(doc.file.url);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();

    // ✅ If it's an image → convert to PDF
    if (["png", "jpg", "jpeg", "webp"].includes(fileExtension)) {
      const pdf = new jsPDF();
      const imgData = await blobToBase64(blob);

      const img = new Image();
      img.src = imgData;

      await new Promise((resolve) => (img.onload = resolve));

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`${doc.raw_data?.name || "Document"}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully");
      return;
    }

    // ✅ If it's already a PDF → download normally
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    toast.dismiss(loadingToast);
    toast.success("Download completed");
  } catch (error) {
    console.error("Error downloading document:", error);
    toast.error("Failed to download document");
  }
};

// 🔹 Helper to convert Blob → Base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};





// const handleDownload = async (doc) => {
//     try {
//         if (!doc.file || !doc.file.url) {
//             toast.error('Document URL not available');
//             return;
//         }

//         const fileName = doc.raw_data?.name 
//             ? `${doc.raw_data.name}.${doc.file.url.split('.').pop()}`
//             : doc.file.url.split('/').pop();
        
//         toast.loading('Starting download...');
        
//         // Use anchor tag without fetch (works for same-origin or public files)
//         const link = document.createElement('a');
//         link.href = doc.file.url;
//         link.download = fileName;
//         link.style.display = 'none';
        
//         document.body.appendChild(link);
//         link.click();
        
//         // Cleanup
//         setTimeout(() => {
//             document.body.removeChild(link);
//             toast.dismiss();
//             toast.success('Download started');
//         }, 100);
        
//     } catch (error) {
//         console.error('Error downloading document:', error);
//         toast.error('Failed to download document');
//     }
// };

// const handleDownload = async (doc) => {
//     try {
//         if (!doc?.file?.url) {
//             toast.error('Document URL not available');
//             return;
//         }

//         // Extract filename with extension
//         const extension = doc.file.url.split('.').pop() || 'file';
//         const fileName = doc.raw_data?.name 
//             ? `${doc.raw_data.name}.${extension}`
//             : doc.file.url.split('/').pop() || 'downloaded_file';

//         // Show loading toast
//         const toastId = toast.loading('Starting download...');

//         // Create invisible anchor tag
//         const link = document.createElement('a');
//         link.href = doc.file.url;
//         link.download = fileName; // Set the desired filename
//         link.style.display = 'none';
//         link.rel = 'noopener noreferrer'; // Security best practice

//         // Append to document, trigger click, and clean up
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);

//         // Dismiss loading toast and show success
//         setTimeout(() => {
//             toast.dismiss(toastId);
//             toast.success('Download started');
//         }, 100);

//     } catch (error) {
//         console.error('Error downloading document:', error);
//         toast.error('Failed to download document');
//     }
// };
const handleBackToPerformCalibration = () => {
        if (inwardId) {
            navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
        } else {
            navigate(-1);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const fileName = doc.file?.url?.split('/').pop() || '';
        return fileName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalEntries = filteredDocuments.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredDocuments.slice(indexOfFirstEntry, indexOfLastEntry);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleEntriesPerPageChange = (e) => {
        setEntriesPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisibleButtons = 5;
        
        buttons.push(
            <button
                key="previous"
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
            >
                Previous
            </button>
        );

        let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

        if (endPage - startPage < maxVisibleButtons - 1) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    className={`px-3 py-1 border border-gray-300 rounded text-sm ${currentPage === i ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="ellipsis" className="px-2 py-1">...</span>);
            }
            buttons.push(
                <button
                    key={totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm"
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </button>
            );
        }

        buttons.push(
            <button
                key="next"
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
            >
                Next
            </button>
        );

        return buttons;
    };

    const getFileTypeDisplay = (document) => {
        if (document.file?.type === 'image') {
            return { label: 'IMAGE', color: 'bg-green-500' };
        } else if (document.file?.type === 'pdf') {
            return { label: 'PDF', color: 'bg-red-500' };
        } else {
            return { label: 'FILE', color: 'bg-gray-500' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex h-[60vh] items-center justify-center text-gray-600">
                    <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                    </svg>
                    <span className="text-lg">Loading Documents...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Delete Confirmation Modal - Full Screen Overlay */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-opacity-20 flex items-start  justify-center pt-20 z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-5">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Validate</h2>
                            <p className="text-gray-600 text-base mb-6">Are you sure you want to delete this document?</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={closeDeleteModal}
                                    className="px-6 py-2 text-gray-800 font-semibold bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-8 py-2 text-white font-semibold bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 m-6">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-800">View Calibration Document</h1>
                    <button
                        onClick={handleBackToPerformCalibration}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        ← Back to Perform Calibration
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Show</span>
                                <select 
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    value={entriesPerPage}
                                    onChange={handleEntriesPerPageChange}
                                >
                                    <option value={25}>25</option>
                                    <option value={35}>35</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-gray-600">entries</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Search:</span>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search files..."
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3 font-medium text-gray-700 border border-gray-300 text-center">ID</th>
                                        <th className="p-3 font-medium text-gray-700 border border-gray-300 text-left">Name</th>
                                        <th className="p-3 font-medium text-gray-700 border border-gray-300 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentEntries.length > 0 ? (
                                        currentEntries.map((document) => {
                                            const fileType = getFileTypeDisplay(document);
                                            const fileName = document.file?.url?.split('/').pop() || 'Unknown File';
                                            
                                            return (
                                                <tr key={document.raw_data.id} className="hover:bg-gray-50">
                                                    <td className="p-3 border border-gray-200 text-center font-medium">
                                                        {document.sr_no}
                                                    </td>
                                                    <td className="p-3 border border-gray-200">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`${fileType.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                                                                {fileType.label}
                                                            </span>
                                                            <span className="text-sm text-gray-700">{fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 border border-gray-200">
                                                        <div className="flex gap-2 justify-center">
                                                            <button 
                                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                                                                onClick={() => openDeleteModal(document)}
                                                                title="Delete document"
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                            <button 
                                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                                                                onClick={() => handleView(document)}
                                                                title="View document"
                                                            >
                                                                <Eye size={14} />
                                                                View
                                                            </button>
                                                            <button 
                                                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                                                                onClick={() => handleDownload(document)}
                                                                title="Download document"
                                                            >
                                                                <Download size={14} />
                                                                Download
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-gray-500">
                                                {searchTerm ? 'No documents found matching your search' : 'No documents available'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                            <div>
                                Showing {totalEntries > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
                            </div>
                            <div className="flex gap-1">
                                {renderPaginationButtons()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewDocuments;

// import { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Page } from "components/shared/Page";
// import { Button } from "components/ui";
// import axios from 'axios';
import { JWT_HOST_API } from "configs/auth.config";

// const ViewDocuments = () => {
//     const navigate = useNavigate();
//     //const { inwardid, itemid } = useParams(); // dynamic URL params
//       const { id: inwardId, itemId: instId } = useParams();
    

//     const [currentPage, setCurrentPage] = useState(1);
//     const [entriesPerPage, setEntriesPerPage] = useState(25);
//     const [searchTerm, setSearchTerm] = useState('');

//     const [documents, setDocuments] = useState([]);
//     const [totalEntries, setTotalEntries] = useState(0);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // Fetch documents from API
//     useEffect(() => {

//        console.log("Params:", inwardId, instId);
//         const fetchDocuments = async () => {
            
//             try {
//                 setLoading(true);
//                 setError(null);

//                 const token = localStorage.getItem('authToken');
               
//                 console.log("Token:", token);

//                 const response = await axios.get(
//                     `${JWT_HOST_API}/calibrationprocess/get-calibration-documents?inwardid=${inwardId}&itemid=${instId}`,
//                     {
// //params: { inwardId, instId },
//                       headers: {
//    Authorization: `Bearer ${token}`,
//   "Content-Type": "application/json"
// }

//                         //withCredentials: true
//                     }
//                 );

//                 // Response structure: { status: true, data: [...] }
//                 if (response.data.status) {
//                     const docs = response.data.data.map((doc, idx) => ({
//                         id: doc.raw_data.id,
//                         name: doc.raw_data.name || `Document_${idx + 1}`,
//                         type: doc.file.type,
//                         url: doc.file.url
//                     }));
//                     setDocuments(docs);
//                     setTotalEntries(docs.length);
//                 } else {
//                     setDocuments([]);
//                     setTotalEntries(0);
//                 }

//             } catch (err) {
//                 console.error('Error fetching documents:', err);
//                 setError(err.message || 'Failed to fetch documents');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (inwardId && instId) fetchDocuments();
//     }, [inwardId, instId]);

//     // Filter documents based on search
//     const filteredDocuments = documents.filter(doc =>
//         doc.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const indexOfLastEntry = currentPage * entriesPerPage;
//     const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
//     const currentEntries = filteredDocuments.slice(indexOfFirstEntry, indexOfLastEntry);

//     const handleBack = () => navigate(-1);
//     const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
//     const handleEntriesPerPageChange = (e) => { setEntriesPerPage(parseInt(e.target.value)); setCurrentPage(1); };

//     const handleView = (doc) => {
//         if (doc.url) window.open(doc.url, '_blank');
//     };

//     const handleDelete = (docId) => {
//         if (window.confirm('Are you sure you want to delete this document?')) {
//             setDocuments(prev => prev.filter(doc => doc.id !== docId));
//         }
//     };

//     if (loading) return <div>Loading documents...</div>;
//     if (error) return <div>Error: {error}</div>;

//     return (
//         <Page title="View Calibration Document">
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
//                 <div className="flex items-center justify-between p-4 border-b border-gray-200">
//                     <h1 className="text-xl font-semibold text-gray-800">View Calibration Document</h1>
//                     <Button variant="outline" onClick={handleBack} className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
//                         ← Back
//                     </Button>
//                 </div>

//                 <div className="p-4">
//                     <div className="flex justify-between items-center mb-4">
//                         <div className="flex items-center gap-2">
//                             <span className="text-sm font-medium text-gray-700">Show</span>
//                             <select value={entriesPerPage} onChange={handleEntriesPerPageChange}>
//                                 <option value={25}>25</option>
//                                 <option value={50}>50</option>
//                                 <option value={100}>100</option>
//                             </select>
//                             <span className="text-sm text-gray-600">entries</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <span className="text-sm">Search:</span>
//                             <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
//                         </div>
//                     </div>

//                     <div className="overflow-x-auto">
//                         <table className="w-full text-sm border-collapse">
//                             <thead>
//                                 <tr className="bg-gray-100">
//                                     <th className="p-3 border">Id</th>
//                                     <th className="p-3 border">Name</th>
//                                     <th className="p-3 border">Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {currentEntries.length > 0 ? currentEntries.map((doc, idx) => (
//                                     <tr key={doc.id}>
//                                         <td className="p-3 border">{indexOfFirstEntry + idx + 1}</td>
//                                         <td className="p-3 border">{doc.name}</td>
//                                         <td className="p-3 border flex gap-2">
//                                             <Button onClick={() => handleView(doc)}>View</Button>
//                                             <Button onClick={() => handleDelete(doc.id)}>Delete</Button>
//                                         </td>
//                                     </tr>
//                                 )) : (
//                                     <tr>
//                                         <td colSpan="3" className="p-8 text-center text-gray-500">No documents found</td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>

//                     <div className="flex justify-between mt-4 text-sm text-gray-600">
//                         <div>Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredDocuments.length)} of {totalEntries} entries</div>
//                         <div className="flex gap-1">
//                             {[...Array(Math.ceil(filteredDocuments.length / entriesPerPage))].map((_, i) => (
//                                 <Button key={i} onClick={() => handlePageChange(i + 1)} className={currentPage === i + 1 ? 'bg-blue-500 text-white' : ''}>{i + 1}</Button>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </Page>
//     );
// };

// export default ViewDocuments;
