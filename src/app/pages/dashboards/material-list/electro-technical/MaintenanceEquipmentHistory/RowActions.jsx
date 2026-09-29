import {
  PencilIcon,
  EyeIcon,
  BookOpenIcon,
  DocumentPlusIcon,
  ClockIcon,
  DocumentIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Button } from "components/ui";
import { useLocation, useParams, Link } from "react-router-dom";
import axios from "utils/axios";
import toast, { Toaster } from "react-hot-toast";

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this validity? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Validity Deleted",
    description: "The validity has been successfully deleted.",
  },
};

// Upload Certificate Scan Component
function UploadCertificateScanModal({ isOpen, onClose, cid, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid file (PDF, JPG, JPEG, or PNG)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!cid) {
      toast.error('Certificate ID is missing');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('id', cid);
      formData.append('file', selectedFile);

      const response = await axios.post('/material/update-Certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        toast.success(response.data.message || 'Certificate file uploaded successfully');

        // Reset form
        setSelectedFile(null);

        // Close modal after short delay
        setTimeout(() => {
          onClose();
          // Call onSuccess callback to refresh data if needed
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        toast.error(response.data.message || 'Failed to upload certificate');
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error(
        error.response?.data?.message ||
        'Failed to upload certificate. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-300">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Certificate Scan
              </h3>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <span className="text-sm font-medium text-gray-700 w-20 pt-2">File</span>
                <div className="flex-1">
                  <input
                    type="file"
                    id="certificateFileUpload"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isUploading}
                    className="w-full text-sm text-gray-500 
                      file:mr-4 file:py-2 file:px-4 
                      file:rounded-md file:border-0 
                      file:text-sm file:font-semibold 
                      file:bg-blue-50 file:text-blue-700 
                      hover:file:bg-blue-100
                      file:cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed
                      file:disabled:cursor-not-allowed"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Accepted formats: PDF, JPG, JPEG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
            <Button
              className="h-8 space-x-1.5 rounded-md px-3 text-xs"
              color="secondary"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              className="h-8 space-x-1.5 rounded-md px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              color="primary"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload Certificate'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

UploadCertificateScanModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  cid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSuccess: PropTypes.func,
};

export function RowActions({ row, table }) {
  const location = useLocation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const params = new URLSearchParams(location.search);
  const fid = params.get("fid");
  const { labSlug } = useParams();
  const labId = params.get("labId");
  const slug = labSlug || 'electro-technical';
  const cid = row.original.id;

  const permissions =
    localStorage.getItem("userPermissions")?.split(",").map(Number) || [];

  const closeModal = () => {
    setDeleteModalOpen(false);
    // Reset states after modal closes
    setTimeout(() => {
      setDeleteSuccess(false);
      setDeleteError(false);
    }, 300);
  };

  const openModal = () => {
    setDeleteModalOpen(true);
    setDeleteSuccess(false);
    setDeleteError(false);
  };

  const openUploadModal = () => {
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    window.location.reload();
  };

  const handleDeleteRows = useCallback(async () => {
    if (!cid) {
      toast.error('Certificate ID is missing');
      return;
    }

    setConfirmDeleteLoading(true);
    setDeleteError(false);

    try {
      console.log('🗑️ Deleting validity with ID:', cid);

      // ✅ Call delete API
      const response = await axios.delete(`/material/delete-master-validity/${cid}`);

      console.log('✅ Delete API Response:', response.data);

      if (response.data?.status === true) {
        // ✅ Show success toast
        toast.success(
          response.data?.message || 'Validity Details Deleted Successfully',
          { duration: 3000 }
        );

        // ✅ Set success state for modal
        setDeleteSuccess(true);

        // ✅ Remove row from table UI without refresh
        if (table.options.meta?.deleteRow) {
          table.options.meta.deleteRow(row);
        }

        // ✅ Close modal after short delay
        setTimeout(() => {
          closeModal();
        }, 1500);

      } else {
        // Handle API error response
        setDeleteError(true);
        toast.error(
          response.data?.message || 'Failed to delete validity',
          { duration: 4000 }
        );
      }

    } catch (error) {
      console.error('❌ Error deleting validity:', error);
      console.error('❌ Error details:', error.response?.data);

      setDeleteError(true);

      const errorMessage = error.response?.data?.message ||
        'Failed to delete validity. Please try again.';

      toast.error(errorMessage, { duration: 4000 });

    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [cid, row, table]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  const actions = [
    // View ReviewForm
    {
      label: "View ReviewForm",
      icon: EyeIcon,
      to: `/dashboards/material-list/${slug}/maintenance-equipment-history/view-review-form?fid=${fid}&cid=${cid}`,
    },

    // Change File
    {
      label: "Change File",
      icon: DocumentIcon,
      onClick: openUploadModal,
    },

    // View Certificate
    {
      label: "View Certificate",
      icon: DocumentIcon,
      onClick: () => {
        const fileUrl = row.original.file_url;
        // Backend returns ".../public/?<timestamp>" when no file was uploaded
        let hasFile = false;
        try {
          hasFile = !!fileUrl && !new URL(fileUrl, window.location.origin).pathname.endsWith("/");
        } catch {
          hasFile = false;
        }
        if (hasFile) {
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast.error('Certificate file not available');
        }
      },
    },

    // Validity Detail
    {
      label: "Validity Detail",
      icon: ClockIcon,
      permission: 70,
      to: `/dashboards/material-list/${slug}/maintenance-equipment-history/validity-detail?fid=${fid}&cid=${cid}`,
    },

    // Edit Validity
    {
      label: "Edit Validity",
      icon: PencilIcon,
      permission: 349,
      to: `/dashboards/material-list/${slug}/maintenance-equipment-history/edit-validity?fid=${fid}&cid=${cid}`,
    },

    // Add IMC
    {
      label: "Add IMC",
      icon: DocumentPlusIcon,
      permission: 434,
      to: `/dashboards/material-list/${slug}/maintenance-equipment-history/add-imc?fid=${fid}&cid=${cid}&labId=${labId}`,
    },

    // Clone Certificate Details
    {
      label: "Clone Certificate Details",
      icon: BookOpenIcon,
      permission: 69,
      to: `/dashboards/material-list/${slug}/maintenance-equipment-history/clone-certificate-details?fid=${fid}&cid=${cid}&labId=${labId}`,
    },

    // Delete
    {
      label: "Delete",
      icon: TrashIcon,
      permission: 350,
      onClick: openModal,
      isDelete: true,
    },
  ];

  const filteredActions = actions.filter(
    (action) =>
      !action.permission || permissions.includes(action.permission)
  );

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            maxWidth: '500px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />

      <div className="flex flex-col items-center gap-1.5 py-2">
        {filteredActions.map((action) => {
          const IconComponent = action.icon || PencilIcon;
          const isDelete = action.isDelete;
          const btnBaseClass = "btn flex h-7 w-[180px] items-center space-x-2 rounded px-2.5 py-1 text-[10px] font-bold outline-none transition-all hover:shadow-md";
          const btnColorClass = isDelete
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : action.label === "Edit Validity"
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-sky-50 text-sky-700 hover:bg-sky-100";

          if (action.to) {
            return (
              <Link
                key={action.label}
                to={action.to}
                className={clsx(btnBaseClass, btnColorClass)}
              >
                <IconComponent className="size-3.5 stroke-2" />
                <span className="truncate">{action.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={clsx(btnBaseClass, btnColorClass)}
            >
              <IconComponent className="size-3.5 stroke-2" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upload Certificate Scan Modal */}
      <UploadCertificateScanModal
        isOpen={uploadModalOpen}
        onClose={closeUploadModal}
        cid={cid}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDeleteRows}
        confirmLoading={confirmDeleteLoading}
        state={state}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};