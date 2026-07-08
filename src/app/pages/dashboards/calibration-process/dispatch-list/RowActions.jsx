// ------------correct code ----------------

// import { useState } from "react";
// import PropTypes from "prop-types";
// import { Button } from "components/ui";
// import { useNavigate } from "react-router";
// import { EyeIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

// export function RowActions({ row }) {
//   const navigate = useNavigate();
//   const [showApproveModal, setShowApproveModal] = useState(false);

//   const handleEdit = () => {
//     const id = row.original.id;
//     navigate(`/dashboards/calibration-process/view-dispatch-form/${id}`);
//   };

//   const handleCloseApproveModal = () => {
//     setShowApproveModal(false);
//   };

//   const handleApproveConfirm = () => {
//     console.log("Dispatch approved for ID:", row.original.id);
//     setShowApproveModal(false);
//   };

//   return (
//     <>
//       {/* ✅ Direct Buttons Instead of Dropdown */}
//       <div className="flex justify-center space-x-2">
//         {/* View Dispatch Form */}
//         <Button
//           onClick={handleEdit}
//           className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
//         >
//           <EyeIcon className="w-4 h-4" />
//           View Dispatch Form
//         </Button>

//         {/* Approve */}
//         <Button
//           onClick={() => setShowApproveModal(true)}
//           className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
//         >
//           <CheckBadgeIcon className="w-4 h-4" />
//           Approve
//         </Button>
//       </div>

//       {/* ✅ Approve Confirmation Modal */}
//       {showApproveModal && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200">
//             <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-lg font-semibold text-gray-800">Validate</h2>
//               <button
//                 onClick={handleCloseApproveModal}
//                 className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
//               >
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </button>
//             </div>
//             <div className="p-6">
//               <p className="text-sm font-medium text-gray-700 mb-4">
//                 Are you sure you want to process?
//               </p>
//             </div>
//             <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
//               <Button
//                 onClick={handleApproveConfirm}
//                 className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
//               >
//                 OK
//               </Button>
//               <Button
//                 onClick={handleCloseApproveModal}
//                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
//               >
//                 CANCEL
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// RowActions.propTypes = {
//   row: PropTypes.object,
// };









//-------- approve button api integration --------------


import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "components/ui";
import { Link } from "react-router-dom";
import { EyeIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { JWT_HOST_API } from "configs/auth.config";

export function RowActions({ row }) {
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  const handleCloseApproveModal = () => {
    setShowApproveModal(false);
  };

  const handleApproveConfirm = async () => {
    // Prevent double submission
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem("authToken");

      if (!token) {
        setResultMessage("Authentication token not found. Please login again.");
        setIsSuccess(false);
        setShowApproveModal(false);
        setShowResultModal(true);
        setIsLoading(false);
        return;
      }

      // Get dispatch_id from row data
      const dispatchId = row.original.id;

      console.log("Sending dispatch_id:", dispatchId);

      if (!dispatchId) {
        setResultMessage("Dispatch ID not found in row data");
        setIsSuccess(false);
        setShowApproveModal(false);
        setShowResultModal(true);
        setIsLoading(false);
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("dispatch_id", dispatchId);

      // Make API call
      const response = await axios.post(
        `${JWT_HOST_API}/calibrationprocess/approve-dispatch`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Check response
      if (response.data.status) {
        setResultMessage("Dispatch approved successfully!");
        setIsSuccess(true);
        setShowApproveModal(false);
        setShowResultModal(true);
      } else {
        // Show the exact error message from API
        const errorMsg = response.data.message || "Failed to approve dispatch";
        setResultMessage(errorMsg);
        setIsSuccess(false);
        setShowApproveModal(false);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Error approving dispatch:", error);

      let errorMessage = "An error occurred. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || "Failed to approve dispatch";
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }

      setResultMessage(errorMessage);
      setIsSuccess(false);
      setShowApproveModal(false);
      setShowResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultModalClose = () => {
    setShowResultModal(false);
    if (isSuccess) {
      // Reload page only on success
      window.location.reload();
    }
  };

  return (
    <>
      {/* Direct Buttons Instead of Dropdown */}
      <div className="flex justify-center space-x-2">
        {/* View Dispatch Form */}
        <Button
          component={Link}
          to={`/dashboards/calibration-process/view-dispatch-form/${row.original.id}`}
          className="h-8 space-x-1.5 rounded-md px-3 text-xs"
          color="primary"
        >
          <EyeIcon className="w-4 h-4" />
          <span>View Dispatch Form</span>
        </Button>

        {/* Approve */}
        {Number(row.original.status) === 0 && permissions.includes(306) && (
          <Button
            onClick={() => setShowApproveModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            <CheckBadgeIcon className="w-4 h-4" />
            Approve
          </Button>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Validate</h2>
              <Button
                onClick={handleCloseApproveModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Are you sure you want to process?
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={handleApproveConfirm}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "OK"}
              </Button>
              <Button
                onClick={handleCloseApproveModal}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                disabled={isLoading}
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Success/Error) */}
      {/* {showResultModal && (
  <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <p className="text-gray-800 text-sm mb-6 text-center leading-relaxed">
          {resultMessage}
        </p>
        <div className="flex justify-center">
          <Button
            onClick={handleResultModalClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  </div>
)} */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/30">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-gray-200">

            {/* Header with Title + Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {/* <h3 className="text-lg font-semibold text-gray-900">Validate</h3> */}
              <Button
                onClick={handleResultModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Body - Message */}
            <div className="p-6">
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                {resultMessage}
              </p>
            </div>

            {/* Footer - Buttons */}
            <div className="flex justify-center gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
              <Button
                onClick={handleResultModalClose}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                OK
              </Button>
              <Button
                onClick={handleResultModalClose}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};






