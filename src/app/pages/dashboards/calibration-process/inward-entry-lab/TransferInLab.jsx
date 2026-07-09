// import { useEffect, useState } from "react";
// import { Button, Input } from "components/ui";
// import { Page } from "components/shared/Page";
// import axios from "utils/axios";
// import { toast } from "sonner";
// import { useNavigate, useLocation } from "react-router";

// export default function EditBdPerson() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // extract id from pathname
//   const pathParts = window.location.pathname.split("/");
//   const id = pathParts[pathParts.length - 1];

//   // extract caliblocation & calibacc from query params
//   const searchParams = new URLSearchParams(location.search);
//   const caliblocation = searchParams.get("caliblocation") || "";
//   const calibacc = searchParams.get("calibacc") || "";

//   const [data, setData] = useState([]);
//   const [labs, setLabs] = useState([]);
//   const [remarks, setRemarks] = useState("");
//   const [remarkError, setRemarkError] = useState(""); // error message state
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `/calibrationprocess/get-lab-data?inward_id=${id}&caliblocation=${caliblocation}&calibacc=${calibacc}`
//         );
//         const result = res.data;
//         if (result.status === "true" && result.data) {
//           const items = result.data.items || [];
//           setData(
//             items.map((item) => ({
//               ...item,
//               allottolab: item.allottolab || "",
//               target_start:
//                 item.target_start ||
//                 new Date().toISOString().split("T")[0],
//               target_end:
//                 item.target_end ||
//                 new Date(
//                   new Date().setDate(new Date().getDate() + 5)
//                 )
//                   .toISOString()
//                   .split("T")[0],
//             }))
//           );
//           setLabs(result.data.labs || []);
//         } else {
//           toast.error(result.message || "Failed to load data.");
//         }
//       } catch (err) {
//         console.error("Fetch error:", err);
//         toast.error("Something went wrong while loading data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [id, caliblocation, calibacc]);

//   // convert dd/mm/yyyy → yyyy-mm-dd
//   const formatDateForInput = (dateString) => {
//     if (!dateString) return "";
//     const parts = dateString.split("/");
//     if (parts.length === 3) {
//       const [day, month, year] = parts;
//       return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
//     }
//     return dateString;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setRemarkError(""); // reset error

//     // remarks validation
//     if (!remarks.trim()) {
//       setRemarkError("Remarks are required!");
//       return;
//     }

//     setLoading(true);
//     try {
//       const payload = {
//         inward_id: id,
//         caliblocation,
//         calibacc,
//         inwarditemid: data.map((item) => item.inwarditemid),
//         transfertolab: data.map((item) => item.allottolab || 1),
//         targetstartdate: data.map((item) =>
//           formatDateForInput(item.target_start)
//         ),
//         targetenddate: data.map((item) =>
//           formatDateForInput(item.target_end)
//         ),
//         remark: remarks,
//       };

//       const res = await axios.post(
//         `/calibrationprocess/transfer-items-toLab`,
//         payload
//       );
//       const result = res.data;

//       if (result.status === "true") {
//         toast.success("Transfer Lab updated successfully ");
//         setTimeout(() => {
//           navigate(
//       `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
//         caliblocation
//       )}&calibacc=${encodeURIComponent(calibacc)}`
//     );
//         }, 1000);
//       } else {
//         toast.error(result.message || "Failed to update data ❌");
//       }
//     } catch (err) {
//       console.error("Save error:", err);
//       toast.error("Something went wrong while updating data.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Page title="Transfer in Lab">
//       <div className="p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
//             Transfer in Lab 
//           </h2>
//          <Button
//                 variant="outline"
//                 className="text-white bg-blue-600 hover:bg-blue-700"
//                 onClick={() =>
//                     navigate(
//                     `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
//                         caliblocation
//                     )}&calibacc=${encodeURIComponent(calibacc)}`
//                     )
//                 }
//                 >
//                 Back to Inward Entry List
//          </Button>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <table className="table-auto border border-gray-400 border-collapse w-full">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="border px-2 py-1">Sr no</th>
//                 <th className="border px-2 py-1">BRN</th>
//                 <th className="border px-2 py-1">LRN</th>
//                 <th className="border px-2 py-1">Name</th>
//                 <th className="border px-2 py-1">Id no</th>
//                 <th className="border px-2 py-1">Serial no</th>
//                 <th className="border px-2 py-1">Location</th>
//                 <th className="border px-2 py-1">Lab</th>
//                 <th className="border px-2 py-1">Target Start</th>
//                 <th className="border px-2 py-1">Target End</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.map((item) => (
//                 <tr key={item.inwarditemid}>
//                   <td className="border px-2 py-1">{item.sr_no}</td>
//                   <td className="border px-2 py-1">{item.bookingrefno}</td>
//                   <td className="border px-2 py-1">{item.lrn}</td>
//                   <td className="border px-2 py-1">{item.name}</td>
//                   <td className="border px-2 py-1">{item.idno}</td>
//                   <td className="border px-2 py-1">{item.serialno}</td>
//                   <td className="border px-2 py-1">{item.location}</td>
//                   <td className="border px-2 py-1">
//                     <select
//                       className="form-control w-full border border-gray-300 p-1 rounded"
//                       name="transfertolab[]"
//                       value={item.allottolab || ""}
//                       onChange={(e) => {
//                         const updatedData = data.map((i) =>
//                           i.inwarditemid === item.inwarditemid
//                             ? { ...i, allottolab: parseInt(e.target.value) }
//                             : i
//                         );
//                         setData(updatedData);
//                       }}
//                       required
//                     >
//                       <option value="">Select Lab</option>
//                       {labs.map((lab) => (
//                         <option key={lab.id} value={lab.id}>
//                           {lab.name}
//                         </option>
//                       ))}
//                     </select>
//                   </td>

//                   <td className="border px-2 py-1">
//                     <input
//                       type="date"
//                       className="w-full border border-gray-300 p-1 rounded"
//                       value={formatDateForInput(item.target_start)}
//                       onChange={(e) => {
//                         const updatedData = data.map((i) =>
//                           i.inwarditemid === item.inwarditemid
//                             ? { ...i, target_start: e.target.value }
//                             : i
//                         );
//                         setData(updatedData);
//                       }}
//                       required
//                     />
//                   </td>

//                   <td className="border px-2 py-1">
//                     <input
//                       type="date"
//                       className="w-full border border-gray-300 p-1 rounded"
//                       value={formatDateForInput(item.target_end)}
//                       onChange={(e) => {
//                         const updatedData = data.map((i) =>
//                           i.inwarditemid === item.inwarditemid
//                             ? { ...i, target_end: e.target.value }
//                             : i
//                         );
//                         setData(updatedData);
//                       }}
//                       required
//                     />
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* Remarks */}
//           <div className="form-group">
//             <label className="block text-sm font-medium text-gray-700">
//               Remarks
//             </label>
//             <Input
//               name="remark"
//               value={remarks}
//               onChange={(e) => {
//                 setRemarks(e.target.value);
//                 if (e.target.value.trim()) setRemarkError("");
//               }}
//               placeholder=""
//               className="form-control"
//             />
//             {remarkError && (
//               <span className="text-red-600 text-sm">{remarkError}</span>
//             )}
//           </div>

//           <Button
//             type="submit"
//             color="success"
//             className="float-right"
//             disabled={loading}
//           >
//             {loading ? (
//               <div className="flex items-center gap-2">
//                 <svg
//                   className="animate-spin h-4 w-4 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   ></circle>
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
//                   ></path>
//                 </svg>
//                 Allotting...
//               </div>
//             ) : (
//               "Allot To Lab"
//             )}
//           </Button>
//         </form>
//       </div>
//     </Page>
//   );
// }

import { useEffect, useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router";

export default function EditBdPerson() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract id from pathname
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  // Extract caliblocation & calibacc from query params
  const searchParams = new URLSearchParams(location.search);
  const caliblocation = searchParams.get("caliblocation") || "";
  const calibacc = searchParams.get("calibacc") || "";

  const [data, setData] = useState([]);
  const [labs, setLabs] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [remarkError, setRemarkError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/calibrationprocess/get-lab-data?inward_id=${id}&caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
        const result = res.data;
        console.log("API Response:", result); // Debug log

        let fetchedItems = [];
        let fetchedLabs = [];

        if ((result.status === "true" || result.status === true || result.success === true) && result.data) {
          fetchedItems = Array.isArray(result.data) ? result.data : (result.data.items || []);
          fetchedLabs = result.data.labs || [];
        }

        // PHP logic explicitly checks status=-2. We'll filter if the status field exists.
        fetchedItems = fetchedItems.filter(item => {
          if (item.status !== undefined) return String(item.status) === "-2";
          if (item.inst_status !== undefined) return String(item.inst_status) === "-2";
          return true; // if no status field, assume backend already filtered
        });

        if (fetchedLabs.length === 0) {
          try {
            const labsRes = await axios.get("/registers/labs");
            if (labsRes.data && Array.isArray(labsRes.data.data)) {
              fetchedLabs = labsRes.data.data;
            } else if (labsRes.data && Array.isArray(labsRes.data)) {
              fetchedLabs = labsRes.data;
            }
          } catch (e) {
            console.error("Failed to fetch labs fallback", e);
          }
        }

        setData(
          fetchedItems.map((item) => ({
            ...item,
            allottolab: item.allottolab || (fetchedLabs[0]?.id || ""),
            target_start:
              item.target_start ||
              new Date().toISOString().split("T")[0],
            target_end:
              item.target_end ||
              new Date(new Date().setDate(new Date().getDate() + (parseInt(item.daysrequired) || 5)))
                .toISOString()
                .split("T")[0],
          }))
        );
        setLabs(fetchedLabs);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, caliblocation, calibacc]);

  // Convert dd/mm/yyyy → yyyy-mm-dd
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateString;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRemarkError(""); // Reset error

    // Remarks validation
    // if (!remarks.trim()) {
    //   setRemarkError("Remarks are required!");
    //   return;
    // }

    // Removed !data.length validation so empty arrays can be submitted.

    // Validate that all items have valid inwarditemid and allottolab
    const invalidItems = data.filter(
      (item) => !item.inwarditemid || !item.allottolab
    );
    if (invalidItems.length > 0) {
      toast.error("All items must have a valid Item ID and assigned Lab.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        inward_id: id,
        caliblocation,
        calibacc,
        inwarditemid: data.map((item) => item.inwarditemid),
        transfertolab: data.map((item) => parseInt(item.allottolab)),
        targetstartdate: data.map((item) => formatDateForInput(item.target_start)),
        targetenddate: data.map((item) => formatDateForInput(item.target_end)),
        remark: remarks,
      };
      console.log("Payload:", payload); // Debug log

      const res = await axios.post(
        `/calibrationprocess/transfer-items-toLab`,
        payload
      );
      const result = res.data;

      if (result.status === "true" || result.status === true || result.success === true) {
        toast.success("Transfer Lab updated successfully ");
        setTimeout(() => {
          navigate(
            `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
              caliblocation
            )}&calibacc=${encodeURIComponent(calibacc)}`
          );
        }, 1000);
      } else {
        toast.error(result.message || "Failed to update data ❌");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Something went wrong while updating data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Transfer in Lab">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Transfer in Lab
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              navigate(
                `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
                  caliblocation
                )}&calibacc=${encodeURIComponent(calibacc)}`
              )
            }
          >
            Back to Inward Entry List
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
              ></path>
            </svg>
          </div>
        ) : !labs.length ? (
          <div className="text-center text-gray-600">
            No labs available to allocate. Please check master data.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <table className="table-auto border border-gray-400 border-collapse w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Sr no</th>
                  <th className="border px-2 py-1">BRN</th>
                  <th className="border px-2 py-1">LRN</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Id no</th>
                  <th className="border px-2 py-1">Serial no</th>
                  <th className="border px-2 py-1">Location</th>
                  <th className="border px-2 py-1">Lab</th>
                  <th className="border px-2 py-1">Target Start</th>
                  <th className="border px-2 py-1">Target End</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.inwarditemid}>
                    <td className="border px-2 py-1">{item.sr_no}</td>
                    <td className="border px-2 py-1">{item.bookingrefno}</td>
                    <td className="border px-2 py-1">{item.lrn}</td>
                    <td className="border px-2 py-1">{item.name}</td>
                    <td className="border px-2 py-1">{item.idno}</td>
                    <td className="border px-2 py-1">{item.serialno}</td>
                    <td className="border px-2 py-1">{item.location}</td>
                    <td className="border px-2 py-1">
                      <select
                        className="form-control w-full border border-gray-300 p-1 rounded"
                        name="transfertolab[]"
                        value={item.allottolab || ""}
                        onChange={(e) => {
                          const updatedData = data.map((i) =>
                            i.inwarditemid === item.inwarditemid
                              ? { ...i, allottolab: parseInt(e.target.value) }
                              : i
                          );
                          setData(updatedData);
                        }}
                        required
                      >
                        <option value="">Select Lab</option>
                        {labs.map((lab) => (
                          <option key={lab.id} value={lab.id}>
                            {lab.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="date"
                        className="w-full border border-gray-300 p-1 rounded"
                        value={formatDateForInput(item.target_start)}
                        onChange={(e) => {
                          const updatedData = data.map((i) =>
                            i.inwarditemid === item.inwarditemid
                              ? { ...i, target_start: e.target.value }
                              : i
                          );
                          setData(updatedData);
                        }}
                        required
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="date"
                        className="w-full border border-gray-300 p-1 rounded"
                        value={formatDateForInput(item.target_end)}
                        onChange={(e) => {
                          const updatedData = data.map((i) =>
                            i.inwarditemid === item.inwarditemid
                              ? { ...i, target_end: e.target.value }
                              : i
                          );
                          setData(updatedData);
                        }}
                        required
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Remarks */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <Input
                name="remark"
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (e.target.value.trim()) setRemarkError("");
                }}
                placeholder=""
                className="form-control"
              />
              {remarkError && (
                <span className="text-red-600 text-sm">{remarkError}</span>
              )}
            </div>

            <Button
              type="submit"
              color="success"
              className="float-right"
              disabled={loading || !labs.length}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Allotting...
                </div>
              ) : (
                "Allot To Lab"
              )}
            </Button>
          </form>
        )}
      </div>
    </Page>
  );
}