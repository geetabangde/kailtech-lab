// import { useParams, useNavigate } from "react-router";
// import { Button } from "components/ui";
// import { Page } from "components/shared/Page";
// export default function EditModes() {
//   const { id } = useParams();
//   console.log("Editing mode with ID:", id);
//   const navigate = useNavigate();
//   return (
//     <Page title="Edit Mode">
//       <div className="p-6">
//                 {/* ✅ Header + Back Button */}
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
//             Edit Modes
//           </h2>
//           <Button
//             variant="outline"
//             className="text-white bg-blue-600 hover:bg-blue-700"
//             onClick={() => navigate("/dashboards/master-data/modes")}
//           >
//             Back to Modes
//           </Button>
//         </div>
       
//       </div>
//     </Page>
//   );
// }


























// import { useParams, useNavigate } from "react-router";
// import { Button } from "components/ui";
// import { Page } from "components/shared/Page";
// import { useState } from "react";

// export default function DispatchList() {
//   const { id } = useParams();
//   const [printLoading, setPrintLoading] = useState(false);

//   // const [showApproveModal, setShowApproveModal] = useState(false); // New state for Approve popup
//   console.log("Editing mode with ID:", id);
//   const navigate = useNavigate();

//   const challanData = {
//     companyName: "Kaltech Test And Research Centre Pvt. Ltd.",
//     address: "Plot No. 141-C, Electronic Complex, Industrial Area, Indore-452010 (MADHYA PRADESH)",
//     email: "contact@kalitech.net",
//     contactPersonName: "Miss. Nisha Patel",
//     contactPersonDesignation: "Manager",
//     contactPersonMobile: "0000000000",
//     customerName: "KRITI INDUSTRIES (INDIA) LIMITED",
//     customerAddress: "Plot No. 75-86, Sector-II, Pithampur-454775, Dist. Dhar (M.P.), Dhar (M.P.)-454775",
//     customerContactName: "Miss. Nidhi Patel",
//     customerContactDesignation: "-",
//     customerContactEmail: "qapthi1@kritindia.co",
//     customerContactMobile: "0000000000",
//     dispatchDate: "02/06/2022",
//     dispatchedThrough: "By Hand",
//     dispatchedBy: "Hitesh Agnihotri",
//     gstNumber: "23AADCK0799A1ZV",
//     challanRef: "KTRC/Challan/0495/02.06.2022",
//     items: [
//       { name: "Digital Universal Testing Machine N.A Instrument", description: "Instrument", certificateNo: "KTRC2022/0919", invoiceNo: "After Calibration", remark: "Attached certificate, invoice" },
//       { name: "KTRC2002/0919 BRN", description: "Instrument", certificateNo: "KTRC2022/0919", invoiceNo: "After Calibration", remark: "Attached certificate, invoice" },
//     ],
//   };

//   const handlePrint = () => {
//     setPrintLoading(true);
//     setTimeout(() => {
//       window.print();
//       setPrintLoading(false);
//     }, 500);
//   };


//   return (
//     <Page title="View Dispatch Form">
//       <div className="p-6">
//         {/* Header + Back Button */}
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center">
//             <img src="/images/logo.png" alt="Logo" className="h-12 mr-2" />
//             <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
//               NON RETURNABLE CHALLAN
//             </h2>
//           </div>
//           <Button
//             variant="outline"
//             className="text-white bg-blue-600 hover:bg-blue-700"
//             onClick={() => navigate("/dashboards/calibration-process/dispatch-list")}
//           >
//             Back to Dispatch list
//           </Button>
//         </div>

//         {/* Company Details */}
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
//           <div className="flex justify-between">
//             <div>
//               <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">
//                 {challanData.companyName}
//               </h3>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 {challanData.address}
//               </p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 Email: {challanData.email}
//               </p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm text-gray-600 dark:text-gray-400">GST No: {challanData.gstNumber}</p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">Ref: {challanData.challanRef}</p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">Date: {challanData.dispatchDate}</p>
//             </div>
//           </div>
//         </div>

//         {/* Customer Details */}
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
//           <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Customer</h3>
//           <p className="text-sm text-gray-600 dark:text-gray-400">{challanData.customerName}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Customer Address: {challanData.customerAddress}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Concern Person Name: {challanData.customerContactName}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Concern Person Designation: {challanData.customerContactDesignation}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Concern Person Email: {challanData.customerContactEmail}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Concern Person Mobile: {challanData.customerContactMobile}</p>
//         </div>

//         {/* Dispatch Details */}
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
//           <div className="flex justify-between">
//             <div>
//               <p className="text-sm text-gray-600 dark:text-gray-400">Dispatch Date: {challanData.dispatchDate}</p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">Dispatch Detail: -</p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm text-gray-600 dark:text-gray-400">Dispatch Through: {challanData.dispatchedThrough}</p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">Dispatched By: {challanData.dispatchedBy}</p>
//             </div>
//           </div>
//         </div>

//         {/* Items Table */}
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
//           <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Items</h3>
//           <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
//             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
//               <tr>
//                 <th className="px-4 py-2">Name of Item</th>
//                 <th className="px-4 py-2">Description of Item</th>
//                 <th className="px-4 py-2">Certificate No</th>
//                 <th className="px-4 py-2">Invoice No</th>
//                 <th className="px-4 py-2">Remark</th>
//               </tr>
//             </thead>
//             <tbody>
//               {challanData.items.map((item, index) => (
//                 <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
//                   <td className="px-4 py-2">{item.name}</td>
//                   <td className="px-4 py-2">{item.description}</td>
//                   <td className="px-4 py-2">{item.certificateNo}</td>
//                   <td className="px-4 py-2">{item.invoiceNo}</td>
//                   <td className="px-4 py-2">{item.remark}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
        
//         {/* Download and Approve Buttons */}
//         <div className="flex justify-end mt-6 no-print space-x-4">
//           <Button onClick={handlePrint} color="success" disabled={printLoading}>
//             {printLoading ? (
//               <div className="flex items-center gap-2">
//                 <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
//                 </svg>
//                 Preparing...
//               </div>
//             ) : (
//               "Download Dispatch Report"
//             )}
//           </Button>
         
//         </div>
//       </div>
//     </Page>
//   );
// }


// import  { useState } from 'react';

// export default function DispatchChallan() {
//   const [printLoading, setPrintLoading] = useState(false);

//   const challanData = {
//     companyName: "Kailtech Test And Research Centre Pvt. Ltd.",
//     address: "Plot No. 141-C, Electronic Complex, Industrial Area, Indore-452010 (MADHYA PRADESH) India",
//     phone: "Ph: 91-731-4787555 (30 lines) Ph: 91-731-4046055, 4048055",
//     email: "Email: contact@kailtech.net",
//     website: "Web: http://www.kailtech.net",
//     gstNumber: "GST No. 23AADCK0799A1ZV",
//     challanRef: "KTRC/Challan/0493/31.05.2022",
//     challanDate: "Date 31/05/2022",
    
//     customerName: "OMKAR TRADERS",
//     customerAddress: "Plot No 05, Sardan Mandi, Palhar Mundiaroad, Palda, Indore, Madhya Pradesh, 452020 Indore (M.P.)-452020",
//     contactPersonName: "Mr. Sanjay Maurya (B.M.)",
//     contactPersonDesignation: "-",
//     contactPersonEmail: "dlindore@gmail.com",
//     contactPersonMobile: "9009987373",
    
//     dispatchDate: "31/05/2022",
//     dispatchDetail: "NA",
//     dispatchThrough: "By Hand",
//     dispatchedBy: "Jitesh Kumar Bairwa",
    
//     items: [
//       {
//         name: "Thermo-Hygrometer TH-23",
//         lrn: "LRN : 2205R1163626",
//         brn: "BRN: KTRC/2205R000126",
//         description: "Instrument : TH-23/N.A LRN : 2205R1163626 Certificate no: KTRC/2205R000126",
//         itemsAttached: "Instrument, certificate, invoice",
//         remark: "After calibration"
//       },
//       {
//         name: "Thermo-Hygrometer TH-24",
//         lrn: "LRN : 2205R1163926",
//         brn: "BRN: KTRC/2205R000226",
//         description: "Instrument : TH-24/N.A LRN : 2205R1163926 Certificate no: KTRC/2205R000226",
//         itemsAttached: "Instrument, certificate, invoice",
//         remark: "After calibration"
//       },
//       {
//         name: "Thermo-Hygrometer TH-25",
//         lrn: "LRN : 2205R1164026",
//         brn: "BRN: KTRC/2205R000326",
//         description: "Instrument : TH-25/N.A LRN : 2205R1164026 Certificate no: KTRC/2205R000326",
//         itemsAttached: "Instrument, certificate, invoice",
//         remark: "After calibration"
//       }
//     ]
//   };

//   const handlePrint = () => {
//     setPrintLoading(true);
//     setTimeout(() => {
//       window.print();
//       setPrintLoading(false);
//     }, 500);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
      
//       <style>{`
//         @media print {
//           body { margin: 0; padding: 0; }
//           .no-print { display: none !important; }
//           .print-container { padding: 20px; }
//         }
        
//         table { border-collapse: collapse; width: 100%; }
//         th, td { border: 1px solid #333; padding: 8px; text-align: left; }
//         th { background-color: #f5f5f5; font-weight: 600; }
//       `}</style>

//       <div className="max-w-7xl mx-auto bg-white shadow-lg print-container">
//         {/* Header Section */}
//         <div className="border-b-2 border-gray-300 pb-4 mb-4">
//         <div className="flex justify-between items-start">
//   {/* Logo and Company Info */}
//   <div className="flex items-start gap-4">
//     {/* ✅ Replace text logo with image */}
//    <div className="bg-white rounded w-auto h-16 flex items-center justify-center overflow-hidden">
//         <img
//           src="/images/krtc.jpg"
//           alt="KTRC Logo"
//           className="w-full h-full object-contain"
//         />
//       </div>

//     <div>
//       <h1 className="text-lg font-bold text-gray-800">
//         {challanData.companyName}
//       </h1>
//       <p className="text-xs text-gray-600 mt-1">{challanData.address}</p>
//       <p className="text-xs text-gray-600">{challanData.phone}</p>
//       <p className="text-xs text-gray-600">
//         {challanData.email} {challanData.website}
//       </p>
//     </div>
//   </div>

//   {/* GST and Challan Info */}
//   <div className="text-right text-xs text-gray-600">
//     <p>{challanData.gstNumber}</p>
//     <p>{challanData.challanRef}</p>
//     <p>{challanData.challanDate}</p>
//   </div>
// </div>

          
//           <h2 className="text-center text-xl font-bold mt-4 text-gray-800">NON RETURNABLE CHALLAN</h2>
//         </div>

//         {/* Customer Details Table */}
//         <table className="mb-4 text-sm">
//           <tbody>
//             <tr>
//               <td className="font-semibold w-1/4 bg-gray-50">Customer</td>
//               <td colSpan="3">{challanData.customerName}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Customer Address</td>
//               <td colSpan="3">{challanData.customerAddress}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person name</td>
//               <td colSpan="3">{challanData.contactPersonName}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person Designation</td>
//               <td colSpan="3">{challanData.contactPersonDesignation}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person email</td>
//               <td colSpan="3">{challanData.contactPersonEmail}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person mobile</td>
//               <td colSpan="3">{challanData.contactPersonMobile}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Dispatch Date</td>
//               <td>{challanData.dispatchDate}</td>
//               <td className="font-semibold bg-gray-50">Dispatch Through</td>
//               <td>{challanData.dispatchThrough}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Dispatch Detail</td>
//               <td>{challanData.dispatchDetail}</td>
//               <td className="font-semibold bg-gray-50">Dispatched By</td>
//               <td>{challanData.dispatchedBy}</td>
//             </tr>
//           </tbody>
//         </table>

//         {/* Items Table */}
//         <table className="mb-6 text-sm">
//           <thead>
//             <tr>
//               <th className="w-1/4">Name of Item</th>
//               <th className="w-2/5">Description of Item in courier</th>
//               <th className="w-1/5">Items Attached</th>
//               <th className="w-1/6">Remark</th>
//             </tr>
//           </thead>
//           <tbody>
//             {challanData.items.map((item, index) => (
//               <tr key={index}>
//                 <td>
//                   <div>{item.name}</div>
//                   <div className="text-xs">{item.lrn} {item.brn}</div>
//                 </td>
//                 <td className="text-xs">{item.description}</td>
//                 <td className="text-xs">{item.itemsAttached}</td>
//                 <td className="text-xs">{item.remark}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Footer */}
//         <div className="text-sm text-gray-700 mb-4">
//           <p className="font-semibold">Regards</p>
//           <p>For Kailtech Test And Research Centre Pvt. Ltd.</p>
//         </div>

//         {/* Download Button */}
//         <div className="flex justify-end no-print">
//           <button
//             onClick={handlePrint}
//             disabled={printLoading}
//             className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
//           >
//             {printLoading ? (
//               <span className="flex items-center gap-2">
//                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"/>
//                 </svg>
//                 Preparing...
//               </span>
//             ) : (
//               "Download Dispatch Report"
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect } from 'react';

// export default function DispatchChallan() {
//   const [printLoading, setPrintLoading] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [challanData, setChallanData] = useState(null);
//   const [dispatchId, setDispatchId] = useState(); // Default ID, can be changed

//   useEffect(() => {
//     fetchDispatchDetails();
//   }, [dispatchId]);

//   const fetchDispatchDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Get token from localStorage
//       const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
//       if (!token) {
//         throw new Error('Authentication token not found. Please login again.');
//       }

//       const response = await fetch(
//         `${JWT_HOST_API}/calibrationprocess/get-dispatch-details/${dispatchId}`,
//         {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const result = await response.json();

//       if (result.success && result.data) {
//         const { dispatch, company, items } = result.data;
//         const companyInfo = company[0];

//         // Transform API data to component format
//         const transformedData = {
//           companyName: companyInfo.name,
//           address: companyInfo.address,
//           phone: companyInfo.phone,
//           email: "Email: contact@kailtech.net",
//           website: `Web: ${companyInfo.website}`,
//           gstNumber: `GST No. ${companyInfo.gstno}`,
//           companyLogo: companyInfo.logo,
//           challanRef: dispatch.challanno,
//           challanDate: `Date ${dispatch.dispatchdate}`,
          
//           customerName: dispatch.customer,
//           customerAddress: dispatch.customeraddress,
//           contactPersonName: dispatch.concernpersonname,
//           contactPersonDesignation: dispatch.concernpersondesignation,
//           contactPersonEmail: dispatch.concernpersonemail,
//           contactPersonMobile: dispatch.concernpersonmobile,
          
//           dispatchDate: dispatch.dispatchdate,
//           dispatchDetail: dispatch.dispatchdetial || "NA",
//           dispatchThrough: dispatch.dispatchthrough,
//           dispatchedBy: dispatch.dispatchedby,
          
//           items: items.map(item => ({
//             name: item.name,
//             lrn: `LRN : ${item.lrn}`,
//             brn: `BRN: ${item.brn}`,
//             idno: item.idno,
//             description: `Instrument : ${item.idno || 'N.A'} LRN : ${item.lrn} Certificate no: ${item.brn}`,
//             itemsAttached: [
//               item.instrument === 'Yes' ? 'Instrument' : null,
//               item.certificate === 'Yes' ? 'Certificate' : null,
//               item.invoice === 'Yes' ? 'Invoice' : null
//             ].filter(Boolean).join(', '),
//             remark: item.remark || 'After calibration'
//           }))
//         };

//         setChallanData(transformedData);
//       } else {
//         throw new Error('Invalid response format');
//       }
//     } catch (err) {
//       setError(err.message);
//       console.error('Error fetching dispatch details:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePrint = () => {
//     setPrintLoading(true);
//     setTimeout(() => {
//       window.print();
//       setPrintLoading(false);
//     }, 500);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"/>
//           </svg>
//           <p className="mt-4 text-gray-600 font-medium">Loading dispatch details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
//         <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
//           <div className="text-center">
//             <div className="text-red-500 text-5xl mb-4">⚠️</div>
//             <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
//             <p className="text-gray-600 mb-6">{error}</p>
//             <button
//               onClick={fetchDispatchDetails}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!challanData) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <p className="text-gray-600">No data available</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <style>{`
//         @media print {
//           body { margin: 0; padding: 0; }
//           .no-print { display: none !important; }
//           .print-container { padding: 20px; }
//         }
        
//         table { border-collapse: collapse; width: 100%; }
//         th, td { border: 1px solid #333; padding: 8px; text-align: left; }
//         th { background-color: #f5f5f5; font-weight: 600; }
//       `}</style>

//       {/* ID Selector - Only visible on screen */}
//       <div className="max-w-7xl mx-auto mb-4 no-print">
//         <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
//           <label htmlFor="dispatchId" className="font-medium text-gray-700">
//             Dispatch ID:
//           </label>
//           <input
//             id="dispatchId"
//             type="text"
//             value={dispatchId}
//             onChange={(e) => setDispatchId(e.target.value)}
//             className="border border-gray-300 rounded px-3 py-2 w-32"
//             placeholder="Enter ID"
//           />
//           <button
//             onClick={fetchDispatchDetails}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
//           >
//             Load Data
//           </button>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto bg-white shadow-lg print-container">
//         {/* Header Section */}
//         <div className="border-b-2 border-gray-300 pb-4 mb-4">
//           <div className="flex justify-between items-start">
//             {/* Logo and Company Info */}
//             <div className="flex items-start gap-4">
//               <div className="bg-white rounded w-auto h-16 flex items-center justify-center overflow-hidden">
//                 <img
//                   src={challanData.companyLogo}
//                   alt="Company Logo"
//                   className="w-full h-full object-contain"
//                   onError={(e) => {
//                     e.target.style.display = 'none';
//                   }}
//                 />
//               </div>

//               <div>
//                 <h1 className="text-lg font-bold text-gray-800">
//                   {challanData.companyName}
//                 </h1>
//                 <p className="text-xs text-gray-600 mt-1">{challanData.address}</p>
//                 <p className="text-xs text-gray-600">{challanData.phone}</p>
//                 <p className="text-xs text-gray-600">
//                   {challanData.email} {challanData.website}
//                 </p>
//               </div>
//             </div>

//             {/* GST and Challan Info */}
//             <div className="text-right text-xs text-gray-600">
//               <p>{challanData.gstNumber}</p>
//               <p>{challanData.challanRef}</p>
//               <p>{challanData.challanDate}</p>
//             </div>
//           </div>
          
//           <h2 className="text-center text-xl font-bold mt-4 text-gray-800">NON RETURNABLE CHALLAN</h2>
//         </div>

//         {/* Customer Details Table */}
//         <table className="mb-4 text-sm">
//           <tbody>
//             <tr>
//               <td className="font-semibold w-1/4 bg-gray-50">Customer</td>
//               <td colSpan="3">{challanData.customerName}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Customer Address</td>
//               <td colSpan="3">{challanData.customerAddress}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person name</td>
//               <td colSpan="3">{challanData.contactPersonName}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person Designation</td>
//               <td colSpan="3">{challanData.contactPersonDesignation}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person email</td>
//               <td colSpan="3">{challanData.contactPersonEmail}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Concern person mobile</td>
//               <td colSpan="3">{challanData.contactPersonMobile}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Dispatch Date</td>
//               <td>{challanData.dispatchDate}</td>
//               <td className="font-semibold bg-gray-50">Dispatch Through</td>
//               <td>{challanData.dispatchThrough}</td>
//             </tr>
//             <tr>
//               <td className="font-semibold bg-gray-50">Dispatch Detail</td>
//               <td>{challanData.dispatchDetail}</td>
//               <td className="font-semibold bg-gray-50">Dispatched By</td>
//               <td>{challanData.dispatchedBy}</td>
//             </tr>
//           </tbody>
//         </table>

//         {/* Items Table */}
//         <table className="mb-6 text-sm">
//           <thead>
//             <tr>
//               <th className="w-1/4">Name of Item</th>
//               <th className="w-2/5">Description of Item in courier</th>
//               <th className="w-1/5">Items Attached</th>
//               <th className="w-1/6">Remark</th>
//             </tr>
//           </thead>
//           <tbody>
//             {challanData.items.map((item, index) => (
//               <tr key={index}>
//                 <td>
//                   <div>{item.name}</div>
//                   <div className="text-xs">{item.lrn}</div>
//                   <div className="text-xs">{item.brn}</div>
//                 </td>
//                 <td className="text-xs">{item.description}</td>
//                 <td className="text-xs">{item.itemsAttached}</td>
//                 <td className="text-xs">{item.remark}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Footer */}
//         <div className="text-sm text-gray-700 mb-4">
//           <p className="font-semibold">Regards</p>
//           <p>For {challanData.companyName}</p>
//         </div>

//         {/* Download Button */}
//         <div className="flex justify-end no-print">
//           <button
//             onClick={handlePrint}
//             disabled={printLoading}
//             className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
//           >
//             {printLoading ? (
//               <span className="flex items-center gap-2">
//                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"/>
//                 </svg>
//                 Preparing...
//               </span>
//             ) : (
//               "Download Dispatch Report"
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JWT_HOST_API } from "configs/auth.config";


export default function DispatchChallan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(112)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [printLoading, setPrintLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challanData, setChallanData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchDispatchDetails();
    } else {
      setError('Dispatch ID not found in URL');
      setLoading(false);
    }
  }, [id]);

  const fetchDispatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(
        `${JWT_HOST_API}/calibrationprocess/get-dispatch-details/${id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const { dispatch, company, items } = result.data;
        const companyInfo = company[0];

        // Transform API data to component format
        const transformedData = {
          companyName: companyInfo.name,
          address: companyInfo.address,
          phone: companyInfo.phone,
          email: "Email: contact@kailtech.net",
          website: `Web: ${companyInfo.website}`,
          gstNumber: `GST No. ${companyInfo.gstno}`,
          companyLogo: companyInfo.logo,
          challanRef: dispatch.challanno,
          challanDate: `Date ${dispatch.dispatchdate}`,
          
          customerName: dispatch.customer,
          customerAddress: dispatch.customeraddress,
          contactPersonName: dispatch.concernpersonname,
          contactPersonDesignation: dispatch.concernpersondesignation,
          contactPersonEmail: dispatch.concernpersonemail,
          contactPersonMobile: dispatch.concernpersonmobile,
          
          dispatchDate: dispatch.dispatchdate,
          dispatchDetail: dispatch.dispatchdetial ,
          dispatchThrough: dispatch.dispatchthrough,
          dispatchedBy: dispatch.dispatchedby,
          
items: items.map(item => ({
  name: item.name,
  lrn: `LRN : ${item.lrn}`,
  brn: `BRN: ${item.brn}`,
  idno: item.idno,
  description: item.description?.trim() || `Instrument : ${item.idno || 'N.A'}`,
  itemsAttached: [
    item.instrument === 'Yes' ? 'Instrument' : null,
    item.certificate === 'Yes' ? 'Certificate' : null,
    item.invoice === 'Yes' ? 'Invoice' : null
  ].filter(Boolean).join(', '),
  remark: item.remark || 'After calibration'
}))

        };

        setChallanData(transformedData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dispatch details:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"/>
          </svg>
          <p className="mt-4 text-gray-600 font-medium">Loading dispatch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchDispatchDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!challanData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-container { padding: 20px; }
        }
        
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
      `}</style>

      <div className="max-w-7xl mx-auto bg-white shadow-lg print-container">
        {/* Header Section */}
        <div className="border-b-2 border-gray-300 pb-4 mb-4">
            <h2 className="text-left text-lg font-semibold mb-2 tracking-wide">
    NON RETURNABLE CHALLAN
  </h2>
          <div className="flex justify-between items-start">
            {/* Logo and Company Info */}
            <div className="flex items-start gap-4">
              <div className="bg-white rounded w-auto h-16 flex items-center justify-center overflow-hidden">
                <img
                  src={challanData.companyLogo}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {challanData.companyName}
                </h1>
                <p className="text-xs text-gray-600 mt-1">{challanData.address}</p>
                <p className="text-xs text-gray-600">{challanData.phone}</p>
                <p className="text-xs text-gray-600">
                  {challanData.email} {challanData.website}
                </p>
              </div>
            </div>

            {/* GST and Challan Info */}
            <div className="text-left text-xs text-gray-600">
              <p>{challanData.gstNumber}</p>
              <p>{challanData.challanRef}</p>
              <p>{challanData.challanDate}</p>
            </div>
          </div>
          
        </div>

        {/* Customer Details Table */}
        <table className="mb-4 text-sm">
          <tbody>
            <tr>
              <td className="font-semibold w-1/4 bg-gray-50">Customer</td>
              <td colSpan="3">{challanData.customerName}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Customer Address</td>
              <td colSpan="3">{challanData.customerAddress}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Concern person name</td>
              <td colSpan="3">{challanData.contactPersonName}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Concern person Designation</td>
              <td colSpan="3">{challanData.contactPersonDesignation}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Concern person email</td>
              <td colSpan="3">{challanData.contactPersonEmail}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Concern person mobile</td>
              <td colSpan="3">{challanData.contactPersonMobile}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Dispatch Date</td>
              <td>{challanData.dispatchDate}</td>
              <td className="font-semibold bg-gray-50">Dispatch Through</td>
              <td>{challanData.dispatchThrough}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-gray-50">Dispatch Detail</td>
              <td>{challanData.dispatchDetail}</td>
              <td className="font-semibold bg-gray-50">Dispatched By</td>
              <td>{challanData.dispatchedBy}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table className="mb-6 text-sm">
          <thead>
            <tr>
              <th className="w-1/4">Name of Item</th>
              <th className="w-2/5">Description of Item in courier</th>
              <th className="w-1/5">Items Attached</th>
              <th className="w-1/6">Remark</th>
            </tr>
          </thead>
          <tbody>
            {challanData.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <div>{item.name}</div>
                  <div className="text-xs">{item.lrn}</div>
                  <div className="text-xs">{item.brn}</div>
                </td>
                <td className="text-xs">{item.description}</td>
                <td className="text-xs">{item.itemsAttached}</td>
                <td className="text-xs">{item.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="text-sm text-gray-700 mb-4">
          <p className="font-semibold">Regards</p>
          <p>For {challanData.companyName}</p>
        </div>

        {/* Download Button */}
        <div className="flex justify-end no-print">
          <button
            onClick={handlePrint}
            disabled={printLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
          >
            {printLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"/>
                </svg>
                Preparing...
              </span>
            ) : (
              "Download Dispatch Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}