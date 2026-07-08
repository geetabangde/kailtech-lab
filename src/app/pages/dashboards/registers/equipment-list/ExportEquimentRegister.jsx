import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "assets/krtc.jpg";

export default function ExportEquimentRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    department: [],
  });

  // Get URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || "";
    
    let department = urlParams.getAll('department[]');
    if (department.length === 0) {
      const depString = urlParams.get('department');
      if (depString) {
          department = depString.split(',');
      } else {
          department = urlParams.getAll('department');
      }
    }
    
    const newFilters = { category, department };
    setFilters(newFilters);
    fetchData(newFilters);
  }, []);

  // Fetch data for export
  const fetchData = async (filterParams) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filterParams.category) {
        params.append('category', filterParams.category);
      }
      if (filterParams.department && filterParams.department.length > 0) {
        filterParams.department.forEach(dept => {
          params.append('department[]', dept);
        });
      }
      
      const res = await axios.get("/register/equipment-list-register", { params });

      if (res.data?.data) {
        let rows = res.data.data;
        const processedData = rows.map((row, index) => ({
          sno: row.sr_no || index + 1,
          name: row.equipment_name || "",
          equipment_id: row.equipment_id || "",
          make: row.make || "",
          year_of_make: row.year_of_make || "",
          model: row.model || "",
          serial_no: row.serial_no || "",
          range: row.range || "",
          accuracy: row.accuracy || "",
          least_count: row.least_count || "",
          last_calibration_date: row.last_calibration_date || "",
          calibration_due_date: row.calibration_due_date || "",
          calibrated_by: row.calibrated_by || "",
        }));
        
        setData(processedData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching export data:", err);
      toast.error("Failed to fetch data for export");
    } finally {
      setLoading(false);
    }
  };

  const formatDateStr = (dateString) => {
    if (!dateString || dateString.includes("0000-00") || dateString.includes("1970")) return "";
    const parts = dateString.split('-');
    if(parts.length === 3 && parts[0].length === 4) { // YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  // Generate PDF matching PHP structure
  const generatePDF = async () => {
    try {
      const logoEl = new Image();
      logoEl.src = logoImg;
      await new Promise((resolve) => {
        logoEl.onload = resolve;
        logoEl.onerror = resolve; 
      });
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "letter"
      });

      const qfNo = "KTRCQF/0604/11"; // Default QF No used in other components
      const companyName = "KAILTECH TEST & RESEARCH CENTRE PVT. LTD.";

      const tableHeaders = [
        "Sr. No",
        "Name of Equipment",
        "Equipment Id",
        "Make",
        "Year Of Make",
        "Model",
        "Serial no",
        "Range",
        "Accuracy",
        "Least count",
        "Last Calibration Date",
        "Calibration Due Date",
        "Calibrated by"
      ];

      const tableData = data.map((row) => [
        row.sno,
        row.name,
        row.equipment_id,
        row.make,
        row.year_of_make,
        row.model,
        row.serial_no,
        row.range,
        row.accuracy,
        row.least_count,
        formatDateStr(row.last_calibration_date),
        formatDateStr(row.calibration_due_date),
        row.calibrated_by
      ]);

      // Add header using AutoTable to maintain layout and borders
      autoTable(doc, {
        theme: 'plain',
        startY: 10,
        margin: { left: 10, right: 10 },
        styles: { 
            fontSize: 10, 
            textColor: 0, 
            lineColor: [0, 0, 0], 
            lineWidth: 0.2, 
            valign: 'middle' 
        },
        columnStyles: {
            0: { cellWidth: 60, halign: 'center' },
            1: { halign: 'center', fontSize: 12, fontStyle: 'bold' },
            2: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
            3: { cellWidth: 40, halign: 'left' }
        },
        didDrawCell: function (data) {
           if (data.section === 'body' && data.column.index === 0 && data.row.index === 0) {
              const cellWidth = data.cell.width;
              const imgWidth = 40; // 40mm
              if (logoEl.width > 0) {
                 const imgHeight = (logoEl.height * imgWidth) / logoEl.width;
                 const xPos = data.cell.x + (cellWidth - imgWidth) / 2;
                 const yPos = data.cell.y + 2; 
                 doc.addImage(logoEl, 'JPEG', xPos, yPos, imgWidth, imgHeight);
              }
           }
        },
        body: [
            [
                { content: companyName, rowSpan: 6, styles: { fontStyle: 'bold', halign: 'center', valign: 'bottom' } }, 
                { content: "Equipment list", rowSpan: 6 },
                { content: "QF. No. " },
                { content: qfNo }
            ],
            [ { content: "Issue No. " }, { content: "01" } ],
            [ { content: "Issue Date " }, { content: "01/06/2019" } ],
            [ { content: "Revision No. " }, { content: "01" } ],
            [ { content: "Revision Date" }, { content: "20/08/2021" } ],
            [ { content: "Page" }, { content: "" } ] 
        ],
      });

      // Updated On row
      const today = new Date();
      const updatedOn = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      let finalY = doc.lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Updated On:- ${updatedOn}`, doc.internal.pageSize.width - 15, finalY, { align: "right" });

      finalY += 3;

      // Add Equipment Table
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: finalY,
        theme: 'grid',
        margin: { left: 10, right: 10, bottom: 40 }, // leave space for footer
        styles: {
          fontSize: 8,
          textColor: 0,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          cellPadding: 1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' }, // Sr. No
          1: { cellWidth: 25 }, // Name
          2: { cellWidth: 35 }, // Eq Id
          3: { cellWidth: 20 }, // Make
          4: { cellWidth: 18, halign: 'center' }, // Year
          5: { cellWidth: 20 }, // Model
          6: { cellWidth: 20 }, // Serial no
          7: { cellWidth: 15 }, // Range
          8: { cellWidth: 15 }, // Accuracy
          9: { cellWidth: 15 }, // Least count
          10: { cellWidth: 22, halign: 'center' }, // Last Calib
          11: { cellWidth: 22, halign: 'center' }, // Due Date
          12: { cellWidth: 'auto' }, // Calibrated by
        },
        didDrawPage: function () {
           const footerY = doc.internal.pageSize.height - 30;
           doc.setFontSize(9);
           doc.setFont("helvetica", "normal");
           
           const x1 = 15;
           const x2 = doc.internal.pageSize.width / 2;
           const x3 = doc.internal.pageSize.width - 40;

           doc.text("Prepared by", x1, footerY);
           doc.text("Sr. Engineer", x1, footerY + 5);
           doc.text("Name:", x1, footerY + 10);
           doc.text("Sign:", x1, footerY + 15);

           doc.text("Reviewed by", x2, footerY, { align: 'center' });
           doc.text("DTM", x2, footerY + 5, { align: 'center' });
           doc.text("Name:", x2 - 10, footerY + 10, { align: 'left' });
           doc.text("Sign:", x2 - 10, footerY + 15, { align: 'left' });

           doc.text("Approved by", x3, footerY);
           doc.text("TM", x3, footerY + 5);
           doc.text("Name:", x3, footerY + 10);
           doc.text("Sign:", x3, footerY + 15);
        }
      });

      doc.save(`equipmentlist_${today.toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
        </svg>
        <div className="mt-2">Loading Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipment List Export</h1>
            <p className="text-gray-600 mb-4">Generate PDF export of equipment list register data.</p>
          </div>

          {/* Current Filters Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category ID</label>
                <div className="mt-1 p-2 bg-white border border-gray-300 rounded-md">
                  {filters.category || "All"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department IDs</label>
                <div className="mt-1 p-2 bg-white border border-gray-300 rounded-md">
                  {filters.department && filters.department.length > 0 ? filters.department.join(", ") : "All"}
                </div>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          {data.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Data Preview ({data.length} records)</h2>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Sr. No", "Name of Equipment", "Equipment Id", "Make", "Year Of Make", "Model", "Serial no", "Range", "Accuracy", "Least count", "Last Calibration Date", "Calibration Due Date", "Calibrated by"].map(header => (
                        <th key={header} className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 5).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.sno}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.equipment_id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.make}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.year_of_make}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.model}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.serial_no}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.range}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.accuracy}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.least_count}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{formatDateStr(row.last_calibration_date)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{formatDateStr(row.calibration_due_date)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.calibrated_by}</td>
                      </tr>
                    ))}
                    {data.length > 5 && (
                      <tr>
                        <td colSpan="13" className="px-3 py-4 text-center text-sm text-gray-500">
                          ... and {data.length - 5} more records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboards/registers/equipment-list')}
              className="flex-1 justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Register
            </button>
            <button
              onClick={generatePDF}
              disabled={loading || data.length === 0}
              className="flex-1 justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {data.length === 0 ? "No Data Available" : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
