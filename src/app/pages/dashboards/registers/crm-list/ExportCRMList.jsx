import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "assets/krtc.jpg";

export default function ExportCRMList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  // removed unused filters state
  const [reportInfo, setReportInfo] = useState(null);

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
    fetchData(newFilters);
  }, []);

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
      
      const res = await axios.get("/register/crmlist", { params });

      if (res.data?.data) {
        let rows = res.data.data;
        setReportInfo(res.data?.report_info || null);
        
        const processedData = rows.map((row, index) => ({
          sno: index + 1,
          name: row.reference_material_name || "",
          code_no: row.code_no || "",
          batch_no: row.batch_no || "",
          source: row.source || "",
          valid_up_to: row.valid_upto || "",
          traceability: row.traceability || "",
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
    if(parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

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

      const qfNo = "KTRC/QF/0604/19"; 
      const companyName = "KAILTECH TEST & RESEARCH CENTRE PVT. LTD.";

      const tableHeaders = [
        "Sr. No",
        "Name of Reference Material",
        "Code No.",
        "Source",
        "Valid UpTo",
        "Traceability"
      ];

      const tableData = data.map((row) => [
        row.sno,
        row.name,
        row.code_no,
        row.source,
        formatDateStr(row.valid_up_to),
        row.traceability
      ]);

      const listTitle = reportInfo?.title || "Standard Solutions List";

      // Add header using AutoTable
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
            0: { cellWidth: 50, halign: 'center' },
            1: { halign: 'center', fontSize: 12, fontStyle: 'bold' },
            2: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
            3: { cellWidth: 40, halign: 'left' }
        },
        didDrawCell: function (data) {
           if (data.section === 'body' && data.column.index === 0 && data.row.index === 0) {
              const cellWidth = data.cell.width;
              const imgWidth = 40;
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
                { content: listTitle, rowSpan: 6 },
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
      const departmentText = reportInfo?.department || "-";
      const today = new Date();
      const updatedOn = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      let finalY = doc.lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Department :- ${departmentText}`, 15, finalY);
      doc.text(`Date :- ${updatedOn}`, doc.internal.pageSize.width - 15, finalY, { align: "right" });

      finalY += 3;

      // Add Data Table
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: finalY,
        theme: 'grid',
        margin: { left: 10, right: 10, bottom: 40 },
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
          0: { cellWidth: 15, halign: 'center' }, // Sr. No
          1: { cellWidth: 55 }, // Name
          2: { cellWidth: 45 }, // Code No
          3: { cellWidth: 50 }, // Source
          4: { cellWidth: 30, halign: 'center' }, // Valid UpTo
          5: { cellWidth: 'auto' }, // Traceability
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

      doc.save(`crmlist_${today.toISOString().split('T')[0]}.pdf`);
      
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
        Loading Export Data...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-dark-900 rounded-lg shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Export Standard Solutions / CRM List
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
          >
            Back to Register
          </button>
          <button
            onClick={generatePDF}
            disabled={data.length === 0}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate PDF
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No data available for the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm border-collapse">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Sr. No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Name of Reference Material</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Code No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Batch no</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Valid UpTo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-600 dark:bg-dark-900">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                  <td className="whitespace-nowrap px-4 py-2 border">{row.sno}</td>
                  <td className="px-4 py-2 border">{row.name}</td>
                  <td className="px-4 py-2 border">{row.code_no}</td>
                  <td className="px-4 py-2 border">{row.batch_no}</td>
                  <td className="px-4 py-2 border">{row.source}</td>
                  <td className="whitespace-nowrap px-4 py-2 border">{formatDateStr(row.valid_up_to)}</td>
                  <td className="px-4 py-2 border">{row.traceability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
