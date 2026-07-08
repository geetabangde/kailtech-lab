import { useState, useEffect } from "react";
import { Button } from "components/ui";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

export default function ViewEnvironmentalRecord() {
  const navigate = useNavigate();
  const params = useParams();

  // Get labId from URL params - check what params are available
  console.log("All URL Params:", params);
  const labId = params.labId || params.id || params['*']?.split('/').pop();

  console.log("Extracted Lab ID:", labId);

  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("02");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [environmentalData, setEnvironmentalData] = useState(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch environmental data from API
  useEffect(() => {
    const fetchEnvironmentalData = async () => {
      console.log("Lab ID from URL:", labId); // Debug log

      if (!labId) {
        console.error("Lab ID is missing. Current URL:", window.location.href);
        toast.error("Lab ID is required. Please navigate from the lab list.");
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching data with params:", {
          labid: labId,
          year: selectedYear,
          month: selectedMonth
        });

        const response = await axios.get(
          `/master/get-enviornmental-record`,
          {
            params: {
              labid: labId,
              year: selectedYear,
              month: selectedMonth
            }
          }
        );

        console.log("API Response:", response.data);

        // Check if response has data
        if (response.data) {
          setEnvironmentalData(response.data);
        } else {
          toast.error("No data found");
        }
      } catch (err) {
        console.error("Error fetching environmental data:", err);
        toast.error("Failed to load environmental data");
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironmentalData();
  }, [labId, selectedYear, selectedMonth]);

  const getMonthName = (monthNum) => {
    const num = parseInt(monthNum);
    return monthNames[num - 1] || "";
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  const handlePrint = () => {
    setPrintLoading(true);
    setTimeout(() => {
      window.print();
      setPrintLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Environmental Record details...
        </div>
      </div>
    );
  }

  if (!labId && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Lab ID Missing</div>
            <div className="text-gray-600 mb-4">
              Please navigate to this page from the lab list with a valid Lab ID.
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Current URL: {window.location.href}
            </div>
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/dashboards/master-data/manage-labs")}
            >
              Back to List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!environmentalData && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 text-lg mb-4">No data available</div>
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/dashboards/master-data/manage-labs")}
            >
              Back to List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .printable-area { 
              padding: 0;
              background: white;
            }
            body { 
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 no-print">
          <h2 className="text-lg font-semibold text-gray-800">Environmental Record List</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-3 items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((month, idx) => (
                  <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>2025</option>
                <option>2024</option>
                <option>2023</option>
              </select>
            </div>
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/dashboards/master-data/manage-labs")}
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6">
          <div className="printable-area">
            <div className="space-y-6 text-sm leading-relaxed print:text-black">

              {/* Main Header */}
              <div className="flex border border-gray-300 bg-white shadow-sm">
                {/* Logo Section */}
                <div className="w-1/3 p-4">
                  <img
                    src="https://kailtech.thehostme.com/2025_05_07/kailtech_new/images/letterhead.jpg"
                    alt="Logo"
                    className="h-10 mb-2 w-auto"
                  />
                  <p className="font-semibold text-sm text-gray-800">
                    Kailtech Test & Research Centre Pvt. Ltd.
                  </p>
                </div>

                {/* Title Section */}
                <div className="w-1/3 p-4 border-l border-gray-300 flex items-center justify-center">
                  <h2 className="text-sm font-bold uppercase text-center text-gray-800">
                    Environmental Conditions
                  </h2>
                </div>

                {/* Info Table */}
                <div className="w-1/3 p-0 border-l border-gray-300 flex">
                  <table className="w-full h-full text-xs text-gray-800 border-collapse">
                    <tbody>
                      {[
                        ["Q.F. No.", environmentalData.qfNo || "KTRCGC/003/01"],
                        ["Issue No.", environmentalData.issueNo || "01"],
                        ["Issue Date", environmentalData.issueDate || "01/05/2019"],
                        ["Revision No.", environmentalData.revisionNo || "01"],
                        ["Revision Date", environmentalData.revisionDate || "20/03/2021"],
                        ["Page", environmentalData.page || "1 of 1"],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-b border-gray-300 last:border-b-0">
                          <td className="p-1 font-semibold border-r border-gray-300 bg-gray-50">{label}</td>
                          <td className="p-1">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Location and Equipment Info */}
              <div className="space-y-4">
                <div className="flex gap-6 text-sm text-gray-700">
                  <span><strong>EQUIPMENT:</strong> {environmentalData.lab_name}</span>
                </div>
                <div className="flex gap-6 text-sm text-gray-700">
                  <span><strong>MONTH:</strong> {getMonthName(environmentalData.month)}</span>
                  <span><strong>YEAR:</strong> {environmentalData.year}</span>
                </div>
              </div>

              {/* Measurement Type and Ranges */}
              {environmentalData.types?.map((type) => (
                <div key={type.type_id} className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <strong>TYPE:</strong> {type.type} ({type.frequency})
                  </div>
                  <div className="flex gap-6 text-sm text-gray-700">
                    {type.ranges?.map((range, idx) => (
                      <span key={idx}>
                        <strong>{range.subtype}:</strong>{' '}
                        {range.rangetype === 'Range'
                          ? `${range.minrange}-${range.maxrange} ${range.unit}`
                          : `${range.minrange} ${range.unit}`
                        }
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Environmental Records Table */}
              <div>
                <table className="w-full border border-gray-300 text-sm text-gray-800">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border border-gray-300 text-left font-semibold w-32">Date</th>
                      <th className="p-3 border border-gray-300 text-left font-semibold w-24">Time</th>
                      <th className="p-3 border border-gray-300 text-left font-semibold w-32">Temperature (°C)</th>
                      <th className="p-3 border border-gray-300 text-left font-semibold w-32">Humidity (%RH)</th>
                      <th className="p-3 border border-gray-300 text-left font-semibold">Added By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {environmentalData.records?.map((record, idx) => {
                      const readings = record.data[0]?.records || [];
                      return readings.map((reading, readingIdx) => (
                        <tr key={`${idx}-${readingIdx}`} className="hover:bg-gray-50">
                          {readingIdx === 0 && (
                            <td
                              className="p-3 border border-gray-300 font-medium"
                              rowSpan={readings.length}
                            >
                              {formatDate(record.date)}
                            </td>
                          )}
                          <td className="p-3 border border-gray-300">
                            {reading.time || '-'}
                          </td>
                          <td className="p-3 border border-gray-300">
                            {reading.temperature || '-'}
                          </td>
                          <td className="p-3 border border-gray-300">
                            {reading.humidity || '-'}
                          </td>
                          {readingIdx === 0 && (
                            <td
                              className="p-3 border border-gray-300"
                              rowSpan={readings.length}
                            >
                              {record.added_by || '-'}
                            </td>
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>

              {/* Department Label */}
              <div className="text-right">
                <span className="text-sm text-gray-600">
                  <strong>DEPARTMENT:</strong> {environmentalData.department}
                </span>
              </div>

            </div>

            {/* Print Button */}
            <div className="flex justify-end mt-6 no-print">
              <button
                onClick={handlePrint}
                disabled={printLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
                  "Download Environmental Record"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}