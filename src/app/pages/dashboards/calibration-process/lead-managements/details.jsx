import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Select, Pagination, PaginationItems, PaginationNext, PaginationPrevious } from "components/ui";
import axios from "utils/axios";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Details = () => {
    const navigate = useNavigate();
    const { id: customerId } = useParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [printLoading, setPrintLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState(null);

    // State for API data
    const [customerDetails, setCustomerDetails] = useState(null);
    const [instrumentData, setInstrumentData] = useState([]);

    // ✅ useCallback to fix the dependency warning
    const fetchCustomerDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/calibrationprocess/detail-leadManagement?id=${customerId}`);

            console.log("API response:", response.data);

            if (response.data && response.data.status) {
                const { customer, addresses, mobiles, calibration_details } = response.data.data;

                const primaryAddress = addresses && addresses.length > 0 ? addresses[0] : null;

                setCustomerDetails({
                    customerName: customer.name || 'N/A',
                    email: customer.email || 'N/A',
                    mobile: mobiles && mobiles.length > 0 ? mobiles.join(", ") : 'N/A',
                    personalName: customer.personal_name || 'N/A',
                    personalMobile: customer.personal_mobile || 'N/A',
                    reportingAddress: primaryAddress ?
                        `${primaryAddress.address}, ${primaryAddress.city}, ${primaryAddress.pincode}` : 'N/A',
                    reportingBillingAddress: primaryAddress ?
                        `${primaryAddress.address}, ${primaryAddress.city}, ${primaryAddress.pincode}` : 'N/A',
                    city: customer.city || 'N/A',
                    state: customer.state || 'N/A',
                    country: customer.country || 'N/A',
                    gstNumber: customer.gstno || 'N/A',
                    panNo: customer.pan || 'N/A'
                });

                if (calibration_details && Array.isArray(calibration_details)) {
                    const mappedInstruments = calibration_details.map((item) => ({
                        id: item.id,
                        inwardId: item.inwardid || 'N/A',
                        lrn: item.lrn || 'N/A',
                        brn: item.bookingrefno || 'N/A',
                        instrumentName: item.name || 'N/A',
                        make: item.make || 'N/A',
                        model: item.model || 'N/A',
                        serialNo: item.serialno || 'N/A',
                        idNo: item.idno || 'N/A',
                        dueDate: item.duedate || 'N/A',
                    }));

                    setInstrumentData(mappedInstruments);
                } else {
                    setInstrumentData([]);
                }

            } else {
                console.warn("Unexpected response structure:", response.data);
                setCustomerDetails(null);
                setInstrumentData([]);
            }

        } catch (err) {
            console.error("Error fetching customer details:", err);
            setCustomerDetails(null);
            setInstrumentData([]);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        if (customerId) {
            fetchCustomerDetails();
        }
    }, [customerId, fetchCustomerDetails]);

    useEffect(() => {
        axios.get("/get-company-info")
            .then(res => {
                if (res.data && res.data.status) {
                    setCompanyInfo(res.data.data);
                }
            })
            .catch(err => console.error("Error fetching company info:", err));
    }, []);

    const handleDownloadDispatchReport = async (instrument) => {
        setPrintLoading(true);

        try {
            // ✅ Fetch JSON data
            const response = await axios.get(
                `/calibrationprocess/get-attachment-data?id=${instrument.id}`
            );

            if (!response.data.status) {
                alert('Failed to fetch dispatch data');
                setPrintLoading(false);
                return;
            }

            const data = response.data;

            // ✅ Create PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // ✅ Add footer image if it exists
            if (data.letterhead_footer) {
                try {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    await new Promise((resolve) => {
                        img.onload = () => {
                            try { doc.addImage(img, 'PNG', 10, 260, 190, 30); } catch (err) { console.warn('Error adding footer image', err); }
                            resolve();
                        };
                        img.onerror = resolve; 
                        img.src = data.letterhead_footer;
                        setTimeout(resolve, 3000);
                    });
                } catch (err) { console.warn('Error fetching footer image', err); }
            }

            // ✅ Add company logo (Left)
            try {
                if (companyInfo?.branding?.logo) {
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'Anonymous';
                    logoImg.src = companyInfo.branding.logo; 
                    await new Promise((resolve) => {
                        logoImg.onload = () => {
                            try { doc.addImage(logoImg, 'PNG', 15, 12, 50, 20); } catch (err) { console.warn('Error adding logo', err); }
                            resolve();
                        };
                        logoImg.onerror = resolve;
                        setTimeout(resolve, 3000);
                    });
                }
            } catch (err) { console.warn('Error fetching logo', err); }

            // ✅ Add Accreditation Text (Right Aligned)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0, 0, 0);
            doc.text('NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 & CC-2348),', 195, 16, { align: 'right' });
            doc.text('BIS Recognized & ISO 9001 Certified Test & Calibration Laboratory', 195, 20, { align: 'right' });

            // ✅ Add company name (Right Aligned)
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 128); // Navy blue
            const companyName = companyInfo?.company?.name || 'Kailtech Test And Research Centre Pvt. Ltd.';
            doc.text(companyName, 195, 30, { align: 'right' });

            // ✅ Add title (Center)
            let yPosition = 50; // Lowered the title position from 45 to 50
            doc.setFontSize(12); // Reduced font size from 14 to 12
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('Reminder for Periodic Calibration of your Equipment', 105, yPosition, { align: 'center' });
            
            yPosition += 12; // Gap before table

            // ✅ Add table using autoTable (Including Customer Name in row 1)
            autoTable(doc, {
                startY: yPosition,
                head: [], // Use body for all rows to easily control colSpan
                body: [
                    [
                        { content: 'Customer Name', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } },
                        { content: data.customer.name || '', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } }
                    ],
                    [
                        { content: 'Inward\nId', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'LRN', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'BRN', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'Instrument\nName', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'Make', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'Model', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'Serail No', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } }, // "Serail No" matches your screenshot
                        { content: 'ID\nNo', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } },
                        { content: 'Calibration\nDue Date', styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255] } }
                    ],
                    [
                        data.instrument.inward_id || '',
                        data.instrument.lrn || '',
                        data.instrument.brn || '',
                        data.instrument.name || '',
                        data.instrument.make || '',
                        data.instrument.model || '',
                        data.instrument.serial_no || '',
                        data.instrument.id_no || 'NA',
                        data.calibration.due_date || ''
                    ]
                ],
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    halign: 'center',
                    valign: 'middle',
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5
                },
                margin: { left: 10, right: 10 }
            });

            // ✅ Save PDF
            doc.save(`Calibration_Reminder_${data.instrument.lrn}.pdf`);

        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to generate dispatch report. Please try again.');
        } finally {
            setPrintLoading(false);
        }
    };

    // Handle back button click
    const handleBackClick = () => {
        navigate('/dashboards/calibration-process/lead-managements');
    };

    // Sort function
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort data
    const filteredData = instrumentData
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
                <div className="inline-flex flex-col ml-1">
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
                <svg className="w-4 h-4 inline ml-1 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 8l5-5 5 5H5z" />
                </svg>
            );
        }

        return (
            <svg className="w-4 h-4 inline ml-1 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 12l-5 5-5-5h10z" />
            </svg>
        );
    };

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Loading UI
    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex h-[60vh] items-center justify-center text-gray-600">
                    <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                    </svg>
                    Loading Customer Details...
                </div>
            </div>
        );
    }

    // Error UI
    if (!customerDetails) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h1 className="text-xl font-semibold text-gray-800">Customer Detail</h1>
                            <Button
                                onClick={handleBackClick}
                                className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                &lt;&lt; Back
                            </Button>
                        </div>
                    </div>
                    <div className="flex h-[40vh] items-center justify-center text-gray-600">
                        <p className="text-lg">No customer details found.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header with Back Button */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-800">Customer Detail</h1>
                        <Button
                            onClick={handleBackClick}
                            className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            &lt;&lt; Back
                        </Button>
                    </div>
                </div>

                {/* Customer Details Section */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6">
                    <div className="overflow-hidden">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Customer Name</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.customerName}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Email</td>
                                    <td className="p-3 bg-white text-sm text-red-600">{customerDetails.email}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Mobile</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.mobile}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Personal Name</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.personalName}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Personal Mobile</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.personalMobile}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Reporting & Billing Address</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.reportingBillingAddress}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Reporting Address</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.reportingAddress}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">City</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.city}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">State</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.state}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">Country</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.country}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">GST Number</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.gstNumber}</td>
                                </tr>
                                <tr>
                                    <td className="text-sm font-medium text-gray-700 bg-gray-100 p-3 border-r border-gray-300 w-48">PAN No.</td>
                                    <td className="p-3 bg-white text-sm">{customerDetails.panNo}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Instruments Table Section */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600">
                                Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Search:</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="text-left p-3 font-medium text-gray-700 border border-gray-300">Id</th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('inwardId')}
                                    >
                                        <div className="flex items-center">
                                            Inward Id
                                            <SortIcon column="inwardId" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('lrn')}
                                    >
                                        <div className="flex items-center">
                                            LRN
                                            <SortIcon column="lrn" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('brn')}
                                    >
                                        <div className="flex items-center">
                                            BRN
                                            <SortIcon column="brn" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('instrumentName')}
                                    >
                                        <div className="flex items-center">
                                            Instrument Name
                                            <SortIcon column="instrumentName" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('make')}
                                    >
                                        <div className="flex items-center">
                                            Make
                                            <SortIcon column="make" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('model')}
                                    >
                                        <div className="flex items-center">
                                            Model
                                            <SortIcon column="model" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('serialNo')}
                                    >
                                        <div className="flex items-center">
                                            Serial No
                                            <SortIcon column="serialNo" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('idNo')}
                                    >
                                        <div className="flex items-center">
                                            ID No
                                            <SortIcon column="idNo" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-3 font-medium text-gray-700 border border-gray-300 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('dueDate')}
                                    >
                                        <div className="flex items-center">
                                            Due Date
                                            <SortIcon column="dueDate" />
                                        </div>
                                    </th>
                                    <th className="text-left p-3 font-medium text-gray-700 border border-gray-300">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedData.length > 0 ? (
                                    displayedData.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="p-3 border border-gray-200">{item.id}</td>
                                            <td className="p-3 border border-gray-200">{item.inwardId}</td>
                                            <td className="p-3 border border-gray-200">{item.lrn}</td>
                                            <td className="p-3 border border-gray-200">{item.brn}</td>
                                            <td className="p-3 border border-gray-200">{item.instrumentName}</td>
                                            <td className="p-3 border border-gray-200">{item.make}</td>
                                            <td className="p-3 border border-gray-200">{item.model}</td>
                                            <td className="p-3 border border-gray-200">{item.serialNo}</td>
                                            <td className="p-3 border border-gray-200">{item.idNo}</td>
                                            <td className="p-3 border border-gray-200">{item.dueDate}</td>
                                            <td className="p-3 border border-gray-200">
                                                <Button
                                                    onClick={() => handleDownloadDispatchReport(item)}
                                                    color="success"
                                                    disabled={printLoading}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                                                >
                                                    {printLoading ? (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                                                            </svg>
                                                            Preparing...
                                                        </div>
                                                    ) : (
                                                        "Download Attachment"
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="p-4 text-center text-gray-500">
                                            No instruments found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Show</span>
                                <Select
                                    data={[10, 25, 50, 100]}
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    classNames={{
                                        root: "w-fit",
                                        select: "h-7 rounded py-1 text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                                    }}
                                />
                                <span>entries</span>
                            </div>

                            {totalPages > 0 && (
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
                            )}

                            <div className="truncate text-sm text-gray-600">
                                {filteredData.length > 0 ? (
                                    `${startIndex + 1} - ${Math.min(startIndex + pageSize, filteredData.length)} of ${filteredData.length} entries`
                                ) : (
                                    "0 entries"
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Details;