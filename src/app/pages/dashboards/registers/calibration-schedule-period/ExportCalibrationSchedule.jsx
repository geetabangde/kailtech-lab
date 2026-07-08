// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import axios from "utils/axios";

// ----------------------------------------------------------------------
export default function ExportCalibrationSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("ExportCalibrationSchedule mounted. URL search query:", location.search);
    
    // Get query parameters from URL
    const params = new URLSearchParams(location.search);
    const exportData = {
      startdate: params.get('startdate') || '',
      enddate: params.get('enddate') || '',
      department: params.getAll('department') || []
    };

    console.log("Parsed export data:", exportData);

    // Validate required parameters
    if (!exportData.startdate || !exportData.enddate) {
      console.warn("Validation failed: missing startdate or enddate");
      alert('Please select start date and end date for export');
      navigate('/dashboards/registers/calibration-schedule-period');
      return;
    }

    handleExport(exportData);
  }, [location.search, navigate]);

  const handleExport = async (exportData) => {
    try {
      setLoading(true);
      
      // Build query parameters for GET request
      const params = new URLSearchParams();
      params.append('startdate', exportData.startdate);
      params.append('enddate', exportData.enddate);
      
      // Handle multiple departments
      if (exportData.department && exportData.department.length > 0) {
        exportData.department.forEach(dept => {
          params.append('department[]', dept);
        });
      }

      console.log("Requesting GET export from backend with params:", params.toString());

      // Request PDF export from backend via GET
      const response = await axios.get(`/registers/exportcalibrationschedule?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calibration-schedule-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Navigate back to the main page
      navigate('/dashboards/registers/calibration-schedule-period');
      
    } catch (error) {
      console.error('Error exporting calibration schedule:', error);
      alert('Error exporting calibration schedule. Please try again.');
      navigate('/dashboards/registers/calibration-schedule-period');
    } finally {
      setLoading(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="h-12 w-12 animate-spin text-blue-500 mx-auto" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Generating PDF Export
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we generate your calibration schedule...
          </p>
        </div>
      </div>
    );
  }

  return null; // Component handles its own navigation
}