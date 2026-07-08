import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Select, Pagination, PaginationItems, PaginationNext, PaginationPrevious } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import { PerformActions } from "./PerformActions";
import { JWT_HOST_API } from 'configs/auth.config';

const PerformCalibration = () => {
    const navigate = useNavigate();

    // Extract ID from URL path
    const pathParts = window.location.pathname.split("/");
    const inwardId = pathParts[pathParts.length - 1];

    // Get URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const caliblocation = searchParams.get("caliblocation") || "Lab";
    const calibacc = searchParams.get("calibacc") || "Nabl";

    const [searchTerm, setSearchTerm] = useState('');


    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [calibrationData, setCalibrationData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewers, setReviewers] = useState([]);

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadName, setUploadName] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [currentUploadItem, setCurrentUploadItem] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [currentCancelItem, setCurrentCancelItem] = useState(null);
    const [showCancelCrfModal, setShowCancelCrfModal] = useState(false);
    const [currentCancelCrfItem, setCurrentCancelCrfItem] = useState(null);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');
    const [revisionRemark, setRevisionRemark] = useState('');
    const [revisionAttachment, setRevisionAttachment] = useState(null);
    const [showAllotModal, setShowAllotModal] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveReason, setApproveReason] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [showEditCalibPointModal, setShowEditCalibPointModal] = useState(false);
    const [currentEditCalibPointItem, setCurrentEditCalibPointItem] = useState(null);

    // Calculate Uncertainty Modal State
    const [showCalculateUncertaintyModal, setShowCalculateUncertaintyModal] = useState(false);
    const [currentCalculateUncertaintyItem, setCurrentCalculateUncertaintyItem] = useState(null);
    const [calculatingUncertainty, setCalculatingUncertainty] = useState(false);

    const downloadFilesAsZip = useCallback(async (fileUrls, zipName = 'certificates.zip') => {
        try {
            // Dynamic import for JSZip
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            const loadingToast = toast.loading("Downloading certificates...", { duration: Infinity });

            let successCount = 0;
            let failCount = 0;

            // Sequential downloads to avoid server overload
            for (let index = 0; index < fileUrls.length; index++) {
                const url = fileUrls[index];

                try {
                    let fullUrl = url;

                    if (!url.startsWith('http')) {
                        fullUrl = `${window.location.origin}/${url.replace(/^\/+/, '')}`;
                    }

                    console.log(`Downloading file ${index + 1}: ${fullUrl}`);

                    const response = await fetch(fullUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/pdf,*/*',
                        },
                        signal: AbortSignal.timeout(30000), // 30 second timeout
                    });

                    if (response.ok && response.status === 200) {
                        const blob = await response.blob();

                        if (blob.size > 0) {
                            let filename = url.split('/').pop() || `certificate_${index + 1}.pdf`;
                            filename = filename.replace(/[^\w\-_.]/g, '_');

                            if (!filename.toLowerCase().endsWith('.pdf')) {
                                filename += '.pdf';
                            }

                            let finalFilename = filename;
                            let counter = 1;
                            while (zip.file(finalFilename)) {
                                const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
                                const ext = filename.substring(filename.lastIndexOf('.'));
                                finalFilename = `${nameWithoutExt}_${counter}${ext}`;
                                counter++;
                            }

                            zip.file(finalFilename, blob);
                            successCount++;

                            console.log(`Successfully added: ${finalFilename}`);
                        } else {
                            console.warn(`Empty file: ${url}`);
                            failCount++;
                        }
                    } else {
                        console.warn(`Failed to download: ${url} (Status: ${response.status})`);
                        failCount++;
                    }
                } catch (fileError) {
                    console.error(`Error downloading file ${url}:`, fileError);
                    failCount++;
                }

                if (index < fileUrls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            toast.dismiss(loadingToast);

            if (successCount === 0) {
                throw new Error('No files could be downloaded successfully. Please check if the certificate links are valid and accessible.');
            }

            if (failCount > 0) {
                toast.warning(`Downloaded ${successCount} files successfully, ${failCount} files failed.`);
            }

            toast.info("Creating ZIP file...", { duration: 2000 });

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });

            const downloadUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = zipName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

            toast.success(`Successfully downloaded ${successCount} certificates as ZIP!`);
            return successCount;

        } catch (error) {
            console.error('Error creating zip file:', error);
            toast.error(`ZIP creation failed: ${error.message}`);
            throw error;
        }
    }, []);

    const fetchCalibrationData = useCallback(async () => {
        if (!inwardId || !caliblocation || !calibacc) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `/calibrationprocess/get-performcalibration-list?caliblocation=${encodeURIComponent(caliblocation)}&calibacc=${encodeURIComponent(calibacc)}&inward_id=${inwardId}`
            );

            if (response.data && response.data.instruments) {
                setCalibrationData(response.data.instruments);
            } else {
                console.warn("No instruments found in response");
                setCalibrationData([]);
            }
        } catch (err) {
            console.error("Error fetching calibration list:", err);
            toast.error("Something went wrong while loading calibration list.");
            setCalibrationData([]);
        } finally {
            setLoading(false);
        }
    }, [inwardId, caliblocation, calibacc]);

    // Fetch reviewers for allotment - wrapped with useCallback
    const fetchReviewers = useCallback(async () => {
        if (!inwardId || !caliblocation || !calibacc) return;

        try {
            const response = await axios.get(
                `calibrationprocess/edit-bdPerson?inward_id=${inwardId}&caliblocation=${encodeURIComponent(caliblocation)}&calibacc=${encodeURIComponent(calibacc)}`
            );

            if (response.data && response.data.reviewers) {
                setReviewers(response.data.reviewers);
            }
        } catch (error) {
            console.error("Error fetching reviewers:", error);
            toast.error("Failed to load reviewers.");
        }
    }, [inwardId, caliblocation, calibacc]);

    // Fetch data on component mount
    useEffect(() => {
        fetchCalibrationData();
        fetchReviewers();
    }, [fetchCalibrationData, fetchReviewers, inwardId, caliblocation, calibacc]);

    // Sort function
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort data
    const filteredData = calibrationData
        .filter(item =>
            Object.values(item).some(value =>
                value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            const aValue = a[sortConfig.key]?.toString().toLowerCase() || '';
            const bValue = b[sortConfig.key]?.toString().toLowerCase() || '';

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const displayedData = filteredData.slice(startIndex, startIndex + pageSize);

    // Handle page size change
    const handlePageSizeChange = (e) => {
        const newPageSize = Number(e.target.value);
        setPageSize(newPageSize);
        setCurrentPage(1);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Sort icon component
    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) {
            return (
                <div className="inline-flex flex-col ml-2">
                    <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 8l5-5 5 5H5z" />
                    </svg>
                    <svg className="w-3 h-3 text-gray-500 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 12l-5 5-5-5h10z" />
                    </svg>
                </div>
            );
        }

        if (sortConfig.direction === 'asc') {
            return (
                <svg className="w-4 h-4 inline ml-2 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 8l5-5 5 5H5z" />
                </svg>
            );
        }

        return (
            <svg className="w-4 h-4 inline ml-2 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 12l-5 5-5-5h10z" />
            </svg>
        );
    };

    // Update selectAll state when filtered data changes
    useEffect(() => {
        if (filteredData.length > 0) {
            const allSelected = filteredData.every(item => selectedItems.includes(item.id));
            setSelectAll(allSelected);
        } else {
            setSelectAll(false);
        }
    }, [selectedItems, filteredData]);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Handle Calculate Uncertainty API call
    const handleCalculateUncertainty = async () => {
        if (!currentCalculateUncertaintyItem) return;

        setCalculatingUncertainty(true);
        try {
            const payload = {
                inwardid: parseInt(inwardId),
                instid: parseInt(currentCalculateUncertaintyItem.id)
            };

            console.log("Calculating uncertainty with payload:", payload);

            // Use the correct endpoint with proper spelling
            // If your domain is kailtech.in
            const response = await axios.post(
                `${JWT_HOST_API}/calibrationprocess/calculate-uncertanity`, // Note: uncertainty spelling
                payload
            );

            if (response.data && response.data.status === "true") {
                toast.success(response.data.message || "Calculate uncertainty successfully");
                fetchCalibrationData();
            } else {
                toast.error(response.data?.message || "Failed to calculate uncertainty");
            }
        } catch (error) {
            console.error("Calculate uncertainty error:", error);

            if (error.response?.status === 404) {
                toast.error("Calculate uncertainty API not found. Please check the endpoint URL.");
            } else if (error.response?.status === 500) {
                toast.error("Server error occurred while calculating uncertainty.");
            } else {
                toast.error(error.response?.data?.message || "Failed to calculate uncertainty");
            }
        } finally {
            setCalculatingUncertainty(false);
            setShowCalculateUncertaintyModal(false);
            setCurrentCalculateUncertaintyItem(null);
        }
    };
    // Handle action navigation
    const handleAction = (action, item) => {
        const baseUrl = `/dashboards/calibration-process/inward-entry-lab`;
        const params = `?caliblocation=${caliblocation}&calibacc=${calibacc}`;

        switch (action) {
            case 'matrix':
                navigate(`${baseUrl}/matrix/${inwardId}/${item.id}${params}`);
                break;
            case 'uploadDocument':
                setCurrentUploadItem(item);
                setShowUploadModal(true);
                break;
            case 'viewDocuments':
                navigate(`${baseUrl}/view-documents/${inwardId}/${item.id}${params}`);
                break;
            case 'addCrf':
                navigate(`${baseUrl}/add-crf/${inwardId}/${item.id}${params}`);
                break;
            case 'cloneItem':
                navigate(`${baseUrl}/clone-item/${inwardId}/${item.id}${params}`);
                break;
            case 'editInstrumentDetail':
                navigate(`${baseUrl}/edit-instrumental-crf/${inwardId}/${item.id}${params}`);
                break;
            case 'cancelCrf':
                setCurrentCancelCrfItem(item);
                setShowCancelCrfModal(true);
                break;
            case 'requestCancelLRN':
                setCurrentCancelItem(item);
                setShowCancelModal(true);
                break;
            case 'requestRevision':
                setShowRevisionModal(true);
                break;
            case 'editDetailsForRevision':
                navigate(`${baseUrl}/edit-details-revision/${inwardId}/${item.id}${params}`);
                break;
            case 'calibrateStep1':
                navigate(`${baseUrl}/calibrate-step1/${inwardId}/${item.id}${params}`);
                break;
            case 'backToStep1':
                navigate(`${baseUrl}/calibrate-step1/${inwardId}/${item.id}${params}`);
                break;
            case 'calibrateStep2':
                navigate(`${baseUrl}/calibrate-step2/${inwardId}/${item.id}${params}`);
                break;
            case 'changeMaster':
                navigate(`${baseUrl}/change-master/${inwardId}/${item.id}${params}`);
                break;
            case 'calibrateStep3':
                navigate(`${baseUrl}/calibrate-step3/${inwardId}/${item.id}${params}`);
                break;
            case 'editInstrumentDetail2':
                navigate(`${baseUrl}/edit-instrument-detail-2/${inwardId}/${item.id}${params}`);
                break;
            case 'editCalibPoint':
                setCurrentEditCalibPointItem(item);
                setShowEditCalibPointModal(true);
                break;
            case 'viewRawdata':
                navigate(`${baseUrl}/view-rawdata/${inwardId}/${item.id}${params}`);
                break;
            case 'viewTraceability':
                navigate(`${baseUrl}/view-traceability/${inwardId}/${item.id}${params}`);
                break;
            case 'viewCertificate':
                navigate(`${baseUrl}/view-certificate/${inwardId}/${item.id}${params}`);
                break;
            case 'viewApprovedCertificate':
                // Open PDF directly in new tab if fileWithFullPath exists
                if (item.fileWithFullPath) {
                    window.open(item.fileWithFullPath, '_blank');
                } else {
                    // Fallback to normal certificate view
                    navigate(`${baseUrl}/view-certificate/${inwardId}/${item.id}${params}`);
                }
                break;
            case 'viewCertificateWithLH':
                navigate(`${baseUrl}/view-certificate-with-lh/${inwardId}/${item.id}${params}`);
                break;
            case 'viewCMCCalculation':
                navigate(`${baseUrl}/view-cmc-calculation/${inwardId}/${item.id}${params}`);
                break;
            case 'review':
                toast.info("Redirecting to review section...", { duration: 2000 });
                setTimeout(() => {
                    navigate(`${baseUrl}/review/${inwardId}/${item.id}${params}`);
                }, 2000);
                break;
            case 'approve':
                navigate(`${baseUrl}/approve/${inwardId}/${item.id}${params}`);
                break;
            case 'regenerateCache':
                navigate(`${baseUrl}/regenerate-cache/${inwardId}/${item.id}${params}`);
                break;
            case 'calculateUncertainty':
                // Show popup modal instead of navigating
                setCurrentCalculateUncertaintyItem(item);
                setShowCalculateUncertaintyModal(true);
                break;

            default:
                console.log('Unknown action:', action);
        }
    };

    const handleBackToList = () => {
        navigate(
            `/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
    };

    const handleBulkAction = async (action) => {
        try {
            switch (action) {
                case 'allotPerson':
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }
                    setShowAllotModal(true);
                    break;

                case 'approveSelected':
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }
                    setShowApproveModal(true);
                    break;

                case 'reviewSelected':
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }
                    setShowReviewModal(true);
                    break;

                case 'viewSticker': {
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }

                    // Multiple selected items ko comma-separated string mein convert karo
                    const instIds = selectedItems.join(',');

                    navigate(`/dashboards/calibration-process/inward-entry-lab/view-sticker/${inwardId}/${instIds}`, {
                        state: {
                            caliblocation,
                            calibacc
                        }
                    });
                    break;
                }

                case 'viewMultipleDraft': {
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }

                    // Create URL with multiple instIds separated by commas
                    const instIds = selectedItems.join(',');

                    navigate(`/dashboards/calibration-process/inward-entry-lab/ViewMultiple/${inwardId}/${instIds}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
                    break;
                }
                case 'viewMultipleTraceability': {
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }

                    // Create comma-separated instIds from selected items
                    const instIds = selectedItems.join(',');

                    // Navigate to viewMultipleTraceability with multiple instIds
                    navigate(`/dashboards/calibration-process/inward-entry-lab/view-multiple-traceability/${inwardId}/${instIds}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
                    break;
                }
                case 'viewMultipleApprovedCertificate': {
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item");
                        return;
                    }

                    // Create comma-separated instIds from selected items
                    const instIds = selectedItems.join(',');

                    // Navigate to viewMultipleApprovedCertificate with multiple instIds
                    navigate(`/dashboards/calibration-process/inward-entry-lab/view-multiple-approved-certificate/${inwardId}/${instIds}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
                    break;
                }


                case 'downloadWithLetterhead': {
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item to download certificates with letterhead");
                        return;
                    }

                    try {
                        toast.info("Preparing certificates with letterhead for download...", { duration: 2000 });

                        // Fetch certificate links with letterhead from the API
                        const response = await axios.get(`/calibrationprocess/download-Certificateswith-letterhead?inwardid=${inwardId}`);

                        if (!response.data.status) {
                            toast.error("Failed to fetch certificate links from the API.");
                            return;
                        }

                        const allCertificateUrls = response.data.data || [];

                        if (allCertificateUrls.length === 0) {
                            toast.error("No certificates with letterhead found for this inward entry.");
                            return;
                        }

                        // Get selected instruments
                        const selectedInstruments = calibrationData.filter(item => selectedItems.includes(item.id));

                        // Collect matching certificate URLs for selected items
                        const certificateUrls = [];

                        selectedInstruments.forEach((item) => {
                            // Use ulrno or lrn as identifier to match filename in URL
                            const identifier = item.ulrno || item.lrn || item.bookingrefno;

                            if (identifier) {
                                // Find the URL that includes the identifier
                                const foundUrl = allCertificateUrls.find(url => url.includes(identifier));

                                if (foundUrl) {
                                    certificateUrls.push(foundUrl);
                                    console.log(`Found certificate with letterhead URL for item ${item.id}: ${foundUrl}`);
                                } else {
                                    console.warn(`No matching certificate with letterhead found for item ${item.id} with identifier ${identifier}`);
                                }
                            } else {
                                console.warn(`No identifier (ulrno/lrn/bookingrefno) found for item ${item.id}`);
                            }
                        });

                        if (certificateUrls.length === 0) {
                            toast.error("No certificate links with letterhead found for the selected items. Please ensure certificates are available.");
                            return;
                        }

                        console.log(`Found ${certificateUrls.length} certificate URLs with letterhead:`, certificateUrls);

                        // ZIP filename with timestamp
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                        const zipFileName = `certificates_with_letterhead_${inwardId}_${timestamp}.zip`;

                        console.log(`Creating ZIP file: ${zipFileName} with ${certificateUrls.length} certificates`);

                        // Create and download ZIP
                        try {
                            const downloadedCount = await downloadFilesAsZip(certificateUrls, zipFileName);

                            if (downloadedCount > 0) {
                                toast.success(`Successfully downloaded ${downloadedCount} certificates with letterhead as ZIP file: ${zipFileName}`);
                            } else {
                                throw new Error("No files downloaded successfully");
                            }
                        } catch (zipError) {
                            console.error("ZIP download failed:", zipError);
                            toast.error(`Failed to create ZIP file: ${zipError.message}`);
                        }

                    } catch (error) {
                        console.error('Download certificates with letterhead error:', error);
                        toast.error(`Failed to download certificates with letterhead: ${error.message || 'Unknown error'}`);
                    }
                    break;
                }
                case 'downloadCertificates': {
                    if (selectedItems.length === 0) {
                        toast.error("Please select at least one item to download certificates");
                        return;
                    }

                    try {
                        toast.info("Preparing certificates for download...", { duration: 2000 });

                        // Fetch certificate links from the API for the inwardId
                        const response = await axios.get(`/calibrationprocess/download-certificates?inwardid=${inwardId}`);

                        if (!response.data.status) {
                            toast.error("Failed to fetch certificate links from the API.");
                            return;
                        }

                        const allCertificateUrls = response.data.data || [];

                        // Get selected instruments
                        const selectedInstruments = calibrationData.filter(item => selectedItems.includes(item.id));

                        // Collect matching certificate URLs for selected items
                        const certificateUrls = [];

                        selectedInstruments.forEach((item) => {
                            // Use ulrno or lrn as identifier to match filename in URL
                            const identifier = item.ulrno || item.lrn || item.bookingrefno;

                            if (identifier) {
                                // Find the URL that includes the identifier (e.g., matches the filename part)
                                const foundUrl = allCertificateUrls.find(url => url.includes(identifier));

                                if (foundUrl) {
                                    certificateUrls.push(foundUrl);
                                    console.log(`Found certificate URL for item ${item.id}: ${foundUrl}`);
                                } else {
                                    console.warn(`No matching certificate URL found for item ${item.id} with identifier ${identifier}`);
                                }
                            } else {
                                console.warn(`No identifier (ulrno/lrn/bookingrefno) found for item ${item.id}`);
                            }
                        });

                        if (certificateUrls.length === 0) {
                            toast.error("No certificate links found for the selected items. Please ensure certificates are available.");
                            return;
                        }

                        console.log(`Found ${certificateUrls.length} certificate URLs:`, certificateUrls);

                        // ZIP filename with timestamp
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                        const zipFileName = `certificates_${inwardId}_${timestamp}.zip`;

                        // Create and download ZIP
                        try {
                            const downloadedCount = await downloadFilesAsZip(certificateUrls, zipFileName);

                            if (downloadedCount > 0) {
                                toast.success(`Successfully downloaded ${downloadedCount} certificates as ZIP file!`);
                            } else {
                                throw new Error("No files downloaded successfully");
                            }
                        } catch (zipError) {
                            console.error("ZIP download failed:", zipError);

                            // Fallback: individual downloads
                            toast.info("ZIP creation failed. Trying individual downloads...", { duration: 2000 });

                            certificateUrls.forEach((url, index) => {
                                setTimeout(() => {
                                    try {
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `certificate_${index + 1}.pdf`;
                                        link.target = '_blank';
                                        link.style.display = 'none';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    } catch (linkError) {
                                        console.error(`Failed to download certificate ${index + 1}:`, linkError);
                                    }
                                }, index * 1000);
                            });

                            toast.success(`Initiated individual downloads for ${certificateUrls.length} certificates`);
                        }

                    } catch (error) {
                        console.error('Download certificates error:', error);
                        toast.error(`Failed to download certificates: ${error.message || 'Unknown error'}`);
                    }
                    break;
                }

                default:
                    console.log('Unknown bulk action:', action);
            }
        } catch (error) {
            console.error('Bulk action error:', error);
            toast.error(`Failed to perform ${action}: ${error.message || 'Unknown error'}`);
        }
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredData.map(item => item.id));
        }
        setSelectAll(!selectAll);
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setUploadFile(file);
    };

    // Handle revision attachment upload
    const handleRevisionAttachmentChange = (e) => {
        const file = e.target.files[0];
        setRevisionAttachment(file);
    };

    // Handle upload form submission
    // const handleUploadSubmit = async () => {
    //     if (!uploadName.trim()) {
    //         toast.error("Please enter a name for the document.");
    //         return;
    //     }

    //     if (!uploadFile) {
    //         toast.error("Please select a file to upload.");
    //         return;
    //     }

    //     try {
    //         // Create FormData
    //         const formData = new FormData();
    //         formData.append('inwardid', inwardId);
    //         formData.append('itemid', currentUploadItem.id);
    //         formData.append('path', uploadFile);





    //          // File ko 'path' key me bhejo
    //         // Note: 'name' field API me required nahi hai, agar chahiye to add kar sakte ho

    //         // Show loading toast
    //         const loadingToast = toast.loading("Uploading document...");

    //         // API call to upload document
    //         const response = await axios.post(
    //             `${JWT_HOST_API}/calibrationprocess/upload-calibration-documents`,
    //             formData,
    //             {
    //                 headers: {
    //                     'Content-Type': 'multipart/form-data'
    //                 }
    //             }
    //         );

    //         // Dismiss loading toast
    //         toast.dismiss(loadingToast);

    //         // Check response
    //         if (response.data && response.data.success) {
    //             toast.success(response.data.message || "Document uploaded successfully!");
    //             // Refresh data
    //             fetchCalibrationData();
    //         } else {
    //             toast.error(response.data?.message || "Failed to upload document.");
    //         }

    //         // Reset form and close modal
    //         setUploadName('');
    //         setUploadFile(null);
    //         setShowUploadModal(false);
    //         setCurrentUploadItem(null);

    //     } catch (error) {
    //         console.error('Upload error:', error);

    //         // Show appropriate error message
    //         if (error.response) {
    //             toast.error(error.response.data?.message || "Failed to upload document.");
    //         } else if (error.request) {
    //             toast.error("No response from server. Please check your connection.");
    //         } else {
    //             toast.error("Failed to upload document.");
    //         }
    //     }
    // };

    const handleUploadSubmit = async () => {
        if (!uploadName.trim()) {
            toast.error("Please enter a name for the document.");
            return;
        }

        if (!uploadFile) {
            toast.error("Please select a file to upload.");
            return;
        }

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('inwardid', inwardId);
            formData.append('itemid', currentUploadItem.id);
            formData.append('path', uploadFile);
            formData.append('name', uploadName); // Added name field

            // Show loading toast
            const loadingToast = toast.loading("Uploading document...");

            // API call to upload document
            const response = await axios.post(
                `${JWT_HOST_API}/calibrationprocess/upload-calibration-documents`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            // Check response
            if (response.data && response.data.success) {
                toast.success(response.data.message || "Document uploaded successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error(response.data?.message || "Failed to upload document.");
            }

            // Reset form and close modal
            setUploadName('');
            setUploadFile(null);
            setShowUploadModal(false);
            setCurrentUploadItem(null);

        } catch (error) {
            console.error('Upload error:', error);

            // Show appropriate error message
            if (error.response) {
                toast.error(error.response.data?.message || "Failed to upload document.");
            } else if (error.request) {
                toast.error("No response from server. Please check your connection.");
            } else {
                toast.error("Failed to upload document.");
            }
        }
    };

    // Handle Cancel LRN submission
    const handleCancelLRNSubmit = async () => {
        if (!cancelReason.trim()) {
            toast.error("Please enter a reason for cancellation.");
            return;
        }

        try {
            // API call to cancel LRN
            const response = await axios.post('/calibration/cancel-lrn', {
                itemId: currentCancelItem.id,
                inwardId: inwardId,
                reason: cancelReason
            });

            if (response.data.success) {
                toast.success("LRN cancelled successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error("Failed to cancel LRN.");
            }

            // Reset form and close modal
            setCancelReason('');
            setShowCancelModal(false);
            setCurrentCancelItem(null);

        } catch (error) {
            console.error('Cancel LRN error:', error);
            toast.error("Failed to cancel LRN.");
        }
    };

    // Handle Cancel CRF confirmation
    const handleCancelCrfConfirm = async () => {
        try {
            // API call
            const response = await axios.get(
                `/calibrationprocess/cancel-crf?inward_id=${inwardId}&inst_id=${currentCancelCrfItem.id}`
            );

            if (response.data.status === "true") {
                toast.success(response.data.message || "CRF cancelled successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error("Failed to cancel CRF.");
            }
        } catch (error) {
            console.error("Cancel CRF error:", error);
            toast.error("Failed to cancel CRF.");
        } finally {
            setShowCancelCrfModal(false);
            setCurrentCancelCrfItem(null);
        }
    };



    const handleRevisionSubmit = async () => {
        if (!revisionReason.trim()) {
            toast.error("Please enter a reason for revision.");
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            if (!token) {
                toast.error("Authentication token missing. Please log in again.");
                return;
            }

            // Create FormData exactly as in Postman
            const formData = new FormData();
            formData.append('inwardid', inwardId);

            // Use the first selected item's ID as instid (or modify logic as needed)
            // If you want to send multiple items, you might need to loop
            formData.append('instid', selectedItems[0]); // Using first selected item

            formData.append('reason', revisionReason);
            formData.append('remark', revisionRemark);

            if (revisionAttachment) {
                formData.append('file', revisionAttachment);
            }

            // API call
            const response = await axios.post(
                `${JWT_HOST_API}/calibrationprocess/submit-revision-request`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Handle response
            if (response.data.status === "true" || response.data.status === true) {
                toast.success(response.data.message || "Revision requested successfully!");
                fetchCalibrationData(); // refresh data
                setSelectedItems([]); // Clear selected items
            } else {
                toast.error(response.data.message || "Failed to request revision.");
            }

            // Reset form and close modal
            setRevisionReason('');
            setRevisionRemark('');
            setRevisionAttachment(null);
            setShowRevisionModal(false);

        } catch (error) {
            console.error('Request revision error:', error);
            toast.error(error.response?.data?.message || "Failed to request revision.");
        }
    };

    // Handle Allot Person submission
    const handleAllotPersonSubmit = async () => {
        if (!selectedPerson) {
            toast.error("Please select a person.");
            return;
        }
        if (selectedItems.length === 0) {
            toast.error("Please select at least one item to allot.");
            return;
        }

        try {
            const payload = {
                inwardid: parseInt(inwardId),
                allotedto: parseInt(selectedPerson),
                ids: selectedItems,
            };

            console.log("Submitting payload:", payload);

            const response = await axios.post("/calibrationprocess/allot-item-to-person", payload);

            if (response.data) {
                toast.success("Person allotted successfully!");
                setSelectedPerson("");
                setSelectedItems([]); // Clear selected items
                setShowAllotModal(false);
                fetchCalibrationData(); // Refresh data to reflect changes
            }
        } catch (error) {
            console.error("Allot person error:", error);
            toast.error(error.response?.data?.message || "Failed to allot person.");
        }
    };

    // Handle Approve Selected submission
    const handleApproveSubmit = async () => {
        if (!approveReason.trim()) {
            toast.error("Please enter a reason for approve/reject.");
            return;
        }

        try {
            const response = await axios.post('/calibrationprocess/approve-certificate', {
                inwardid: Number(inwardId),   // ensure number
                itemid: Array.isArray(selectedItems) ? selectedItems.join(",") : String(selectedItems),
                type: "approve",
                reviewdate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
                reason: approveReason
            });
            if (response.data.status) {
                toast.success("Items approved successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error("Failed to approve items.");
            }

            setApproveReason('');
            setShowApproveModal(false);
        } catch (error) {
            console.error('Approve error:', error);
            toast.error("Failed to approve items.");
        }
    };

    // Handle Reject Selected submission
    const handleRejectSubmit = async () => {
        if (!approveReason.trim()) {
            toast.error("Please enter a reason for approve/reject.");
            return;
        }

        try {
            const response = await axios.post('/calibrationprocess/approve-certificate', {
                inwardid: Number(inwardId),   // ensure number
                itemid: Array.isArray(selectedItems) ? selectedItems.join(",") : String(selectedItems),
                type: "reject",
                approvedate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"

                reason: approveReason
            });
            if (response.data.status) {
                toast.success("Items rejected successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error("Failed to reject items.");
            }

            setApproveReason('');
            setShowApproveModal(false);
        } catch (error) {
            console.error('Reject error:', error);
            toast.error("Failed to reject items.");
        }
    };



    // Handle Review Selected submission
    const handleReviewSubmit = async () => {
        if (!reviewReason.trim()) {
            toast.error("Please enter a reason for review.");
            return;
        }

        try {
            const response = await axios.post('/calibrationprocess/review-certificate', {
                inwardid: Number(inwardId),   // ensure number
                itemid: Array.isArray(selectedItems) ? selectedItems.join(",") : String(selectedItems),
                type: "approve",
                reviewdate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
                reason: reviewReason
            });


            if (response.data.status) {
                toast.success("Items reviewed successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error("Failed to review items.");
            }

            setReviewReason('');
            setShowReviewModal(false);
        } catch (error) {
            console.error('Review error:', error);
            toast.error("Failed to review items.");
        }
    };

    const handleRejectReviewSubmit = async () => {
        if (!reviewReason.trim()) {
            toast.error("Please enter a reason for review.");
            return;
        }

        try {
            const response = await axios.post('/calibrationprocess/review-certificate', {
                inwardid: Number(inwardId),   // ensure number
                itemid: Array.isArray(selectedItems) ? selectedItems.join(",") : String(selectedItems),
                type: "reject",
                reviewdate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"

                reason: reviewReason
            });
            if (response.data.status) {
                toast.success("Items rejected successfully!");
                // Refresh data
                fetchCalibrationData();
            } else {
                toast.error("Failed to reject items.");
            }

            setReviewReason('');
            setShowReviewModal(false);
        } catch (error) {
            console.error('Reject error:', error);
            toast.error("Failed to reject items.");
        }
    };

    // Close modal functions
    const handleCloseUploadModal = () => {
        setShowUploadModal(false);
        setUploadName('');
        setUploadFile(null);
        setCurrentUploadItem(null);
    };

    const handleCloseCancelModal = () => {
        setShowCancelModal(false);
        setCancelReason('');
        setCurrentCancelItem(null);
    };

    const handleCloseCancelCrfModal = () => {
        setShowCancelCrfModal(false);
        setCurrentCancelCrfItem(null);
    };

    const handleCloseRevisionModal = () => {
        setShowRevisionModal(false);
        setRevisionReason('');
        setRevisionRemark('');
        setRevisionAttachment(null);
    };

    const handleCloseAllotModal = () => {
        setShowAllotModal(false);
        setSelectedPerson('');
    };

    const handleCloseApproveModal = () => {
        setShowApproveModal(false);
        setApproveReason('');
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setReviewReason('');
    };

    // Handle Edit Calib Point confirmation
    const handleEditCalibPointConfirm = () => {
        const baseUrl = `/dashboards/calibration-process/inward-entry-lab`;
        const params = `?caliblocation=${caliblocation}&calibacc=${calibacc}`;

        // Navigate to edit calib point page
        navigate(`${baseUrl}/edit-calib-point/${inwardId}/${currentEditCalibPointItem.id}${params}`);

        // Close the modal
        setShowEditCalibPointModal(false);
        setCurrentEditCalibPointItem(null);
    };

    // Handle Edit Calib Point modal close
    const handleCloseEditCalibPointModal = () => {
        setShowEditCalibPointModal(false);
        setCurrentEditCalibPointItem(null);
    };

    // Handle Calculate Uncertainty modal close
    const handleCloseCalculateUncertaintyModal = () => {
        setShowCalculateUncertaintyModal(false);
        setCurrentCalculateUncertaintyItem(null);
        setCalculatingUncertainty(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="flex h-[60vh] items-center justify-center text-gray-600">
                            <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                            </svg>
                            Loading Perform Calibration data...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-800">Perform Calibration</h1>
                        <Button
                            onClick={handleBackToList}
                            className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            ← Back to Inward Entry List
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Controls */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Search:</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search ID, Customer..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-visible" style={{ position: 'relative', zIndex: 10 }}>
                        <table className="w-full text-sm border-collapse min-w-[1200px]" style={{ position: 'relative' }}>
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="text-center p-3 font-semibold text-gray-700 border border-gray-300 w-16">
                                        <div className="flex flex-col items-center gap-1">
                                            S NO
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="rounded focus:ring-blue-500 mt-1"
                                            />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 min-w-[160px] cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('refNo')}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>Ref No</span>
                                            <SortIcon column="refNo" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 min-w-[120px] cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>Name</span>
                                            <SortIcon column="name" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 min-w-[120px] cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('typeOfInstrument')}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span>Type of</span>
                                            <span>Instrument</span>
                                            <SortIcon column="typeOfInstrument" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 w-20 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('idNo')}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>Id no</span>
                                            <SortIcon column="idNo" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 w-20 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('serialNo')}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>Serial no</span>
                                            <SortIcon column="serialNo" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 min-w-[120px] cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('calibrationMethod')}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span>Calibration</span>
                                            <span>Method</span>
                                            <SortIcon column="calibrationMethod" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-3 font-semibold text-gray-700 border border-gray-300 min-w-[100px] cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('allotedTo')}
                                    >
                                        <div className="flex items-center justify-center">
                                            <span>Alloted to</span>
                                            <SortIcon column="allotedTo" />
                                        </div>
                                    </th>
                                    <th className="text-center p-3 font-semibold text-gray-700 border border-gray-300 w-20">
                                        <span>Matrix</span>
                                    </th>
                                    <th className="text-center p-3 font-semibold text-gray-700 border border-gray-300 min-w-[80px]">
                                        <span>Perform</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedData.length > 0 ? (
                                    displayedData.map((item, itemIndex) => {
                                        const allotedReviewer = reviewers.find(r => r.id == item.allotedto);
                                        const allotedToDisplay = allotedReviewer
                                            ? `${allotedReviewer.firstname || ''} ${allotedReviewer.middlename || ''} ${allotedReviewer.lastname || ''}`.replace(/\s+/g, ' ').trim()
                                            : item.allotedto;

                                        return (
                                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-3 text-center border border-gray-200">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="font-medium">{startIndex + itemIndex + 1}</span>

                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => handleSelectItem(item.id)}
                                                            className="rounded focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3 border border-gray-200">
                                                    <div className="flex flex-col">
                                                        {item.bookingrefno && (
                                                            <span className="text-xs">
                                                                <strong>BRN:</strong> {item.bookingrefno}
                                                                {item.rev > 0 && `/R${item.rev}`}
                                                            </span>
                                                        )}
                                                        {item.lrn && (
                                                            <span className="text-xs">
                                                                <strong>LRN:</strong> {item.lrn}
                                                            </span>
                                                        )}
                                                        {item.ulrno && item.ulrno !== 'N.A' && (
                                                            <span className="text-xs">
                                                                <strong>ULR NO.:</strong> {item.ulrno}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 border border-gray-200">
                                                    <span className="font-medium">{item.name}</span>
                                                </td>
                                                <td className="p-3 border border-gray-200">
                                                    {item.type_of_instrument || item.name}
                                                </td>
                                                <td className="p-3 text-center border border-gray-200">
                                                    <span className="font-medium">{item.idno}</span>
                                                </td>
                                                <td className="p-3 text-center border border-gray-200">
                                                    <span className="font-medium">{item.serialno}</span>
                                                </td>
                                                <td className="p-3 border border-gray-200">
                                                    <span className="font-medium">{item.sop_method}</span>
                                                </td>
                                                <td className="p-3 border border-gray-200">
                                                    {allotedToDisplay}
                                                </td>
                                                <td className="p-3 text-center border border-gray-200">
                                                    <Button
                                                        onClick={() => handleAction('matrix', item)}
                                                        className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Matrix
                                                    </Button>
                                                </td>
                                                <td className="p-3 text-center border border-gray-200">
                                                    <PerformActions
                                                        item={item}
                                                        onAction={handleAction}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="p-4 text-center text-gray-500">
                                            No calibration instruments found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Section */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                            {/* Show entries section */}
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Show</span>
                                <Select
                                    data={[10, 20, 30, 40, 50, 100]}
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    classNames={{
                                        root: "w-fit",
                                        select: "h-7 rounded-full py-1 text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                                    }}
                                />
                                <span>entries</span>
                                {selectedItems.length > 0 && (
                                    <span className="ml-4 text-blue-600 font-medium">
                                        ({selectedItems.length} selected)
                                    </span>
                                )}
                            </div>

                            {/* Pagination component */}
                            <div>
                                <Pagination
                                    total={totalPages}
                                    value={currentPage}
                                    onChange={handlePageChange}
                                    siblings={2}
                                    boundaries={1}
                                >
                                    <PaginationPrevious />
                                    <PaginationItems />
                                    <PaginationNext />
                                </Pagination>
                            </div>

                            {/* Entries info */}
                            <div className="truncate text-sm text-gray-600">
                                {filteredData.length > 0 ? (
                                    `${startIndex + 1} - ${Math.min(startIndex + pageSize, filteredData.length)} of ${filteredData.length} entries`
                                ) : (
                                    "0 entries"
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => handleBulkAction('allotPerson')}
                                className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Allot Person
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('approveSelected')}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Approve Selected
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('reviewSelected')}
                                className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Review Selected
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('viewSticker')}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                View Sticker
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('viewMultipleDraft')}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                View Multiple Draft
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('viewMultipleTraceability')}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                View Multiple Traceability
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('viewMultipleApprovedCertificate')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                View Multiple Approved Certificate
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('downloadWithLetterhead')}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Download With Letter head
                            </Button>
                            <Button
                                onClick={() => handleBulkAction('downloadCertificates')}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Download Certificates
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Upload Document Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200 mb-30">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Upload Calibration Document</h2>
                                <button
                                    onClick={handleCloseUploadModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {/* Name Field */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadName}
                                        onChange={(e) => setUploadName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Enter document name"
                                    />
                                </div>

                                {/* Upload Document Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Document
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="upload-document-input"
                                            type="file"
                                            onChange={handleFileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 text-sm"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                    </div>
                                    {uploadFile && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Selected: {uploadFile.name}
                                        </p>
                                    )}
                                </div>

                                {/* Add Image Button */}
                                <div className="mb-6">
                                    <Button
                                        onClick={() => document.getElementById('upload-document-input').click()}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        Add Image
                                    </Button>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleCloseUploadModal}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleUploadSubmit}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Cancel LRN Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Cancel LRN</h2>
                                <button
                                    onClick={handleCloseCancelModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason For Cancellation
                                    </label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                        placeholder="Reason For Accept / Reject"
                                        rows={4}
                                    />
                                    <p className="text-red-500 text-xs mt-1">This field is required *</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleCloseCancelModal}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleCancelLRNSubmit}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Review
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel CRF Modal */}
                {showCancelCrfModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Cancel CRF</h2>
                                <button
                                    onClick={handleCloseCancelCrfModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-sm font-medium text-gray-700 mb-4">
                                    Are you sure you want to delete?
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={() => handleCancelCrfConfirm()}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Yes
                                </Button>
                                <Button
                                    onClick={handleCloseCancelCrfModal}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    No
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Revision Modal */}
                {showRevisionModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Request Revision</h2>
                                <button
                                    onClick={handleCloseRevisionModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason For Revision
                                    </label>
                                    <textarea
                                        value={revisionReason}
                                        onChange={(e) => setRevisionReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                        placeholder="Reason For Accept / Reject"
                                        rows={3}
                                    />
                                    <p className="text-red-500 text-xs mt-1">This field is required *</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remark
                                    </label>
                                    <textarea
                                        value={revisionRemark}
                                        onChange={(e) => setRevisionRemark(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                        placeholder="Enter remarks"
                                        rows={2}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Attachment
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="file"
                                            onChange={handleRevisionAttachmentChange}
                                            className="hidden"
                                            id="revision-attachment"
                                        />
                                        <label
                                            htmlFor="revision-attachment"
                                            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                                        >
                                            Choose File
                                        </label>
                                        <span className="ml-2 text-sm text-gray-500 truncate">
                                            {revisionAttachment ? revisionAttachment.name : "No file chosen"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleCloseRevisionModal}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleRevisionSubmit}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Allot Items to Person Modal */}
                {showAllotModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto border border-gray-200 mb-30 ">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Allot Items to Person</h2>
                                <button
                                    onClick={handleCloseAllotModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select person
                                    </label>
                                    <select
                                        value={selectedPerson}
                                        onChange={(e) => setSelectedPerson(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        <option value="">Select</option>
                                        {reviewers.map((person) => (
                                            <option key={person.id} value={person.id}>
                                                {`${person.firstname} ${person.middlename || ''} ${person.lastname}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleCloseAllotModal}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleAllotPersonSubmit}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approve Calibration Certificate Modal */}
                {showApproveModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Approve Calibration Certificate</h2>
                                <button
                                    onClick={handleCloseApproveModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason For Action
                                    </label>
                                    <textarea
                                        value={approveReason}
                                        onChange={(e) => setApproveReason(e.target.value)}
                                        className="w-full px-3 py-2 bg-yellow-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                        placeholder="Reason For Accept / Reject"
                                        rows={4}
                                    />
                                    <p className="text-red-500 text-xs mt-1">This field is required *</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleRejectSubmit}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Reject
                                </Button>
                                <Button
                                    onClick={handleApproveSubmit}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Approve
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Calibration Certificate Modal */}
                {showReviewModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Review Calibration Certificate</h2>
                                <Button
                                    onClick={handleCloseReviewModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason For Action
                                    </label>
                                    <textarea
                                        value={reviewReason}
                                        onChange={(e) => setReviewReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                        placeholder="Reason For Accept / Reject"
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleRejectReviewSubmit}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Reject
                                </Button>
                                <Button
                                    onClick={handleReviewSubmit}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Review
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Calib Point Confirmation Modal */}
                {showEditCalibPointModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Validate</h2>
                                <button
                                    onClick={handleCloseEditCalibPointModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-700 text-sm mb-6">
                                    Are you sure you want to Process?
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleCloseEditCalibPointModal}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    onClick={handleEditCalibPointConfirm}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    OK
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Calculate Uncertainty Modal */}
                {showCalculateUncertaintyModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto border border-gray-200 mb-30">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Validate</h2>
                                <Button
                                    onClick={handleCloseCalculateUncertaintyModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                    disabled={calculatingUncertainty}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-700 text-sm mb-6">
                                    Are you sure you want to Process?
                                </p>
                                {/* {currentCalculateUncertaintyItem && (
                                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                                        <p className="text-xs text-gray-600">
                                            <strong>Instrument:</strong> {currentCalculateUncertaintyItem.name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            <strong>ID No:</strong> {currentCalculateUncertaintyItem.idno}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            <strong>Serial No:</strong> {currentCalculateUncertaintyItem.serialno}
                                        </p>
                                    </div>
                                )} */}
                            </div>

                            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                                <Button
                                    onClick={handleCloseCalculateUncertaintyModal}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                    disabled={calculatingUncertainty}
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    onClick={handleCalculateUncertainty}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                    disabled={calculatingUncertainty}
                                >
                                    {calculatingUncertainty ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                                            </svg>
                                            Calculating...
                                        </>
                                    ) : (
                                        'OK'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformCalibration;






