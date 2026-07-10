import clsx from "clsx";
import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Button } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import { useLocation } from "react-router";

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this Inward Entry? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Inward Entry operation deleted",
  },
};

export function RowActions({ row, table }) {
  const location = useLocation();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Convert localStorage string to array of numbers
  const permissions =
    localStorage.getItem("userPermissions")?.split(",").map(Number) || [];

  const closeModal = () => {
    setDeleteModalOpen(false);
  };

  const handleDeleteRows = useCallback(async () => {
    const id = row.original.id;
    const params = new URLSearchParams(location.search);
    const caliblocation =
      params.get("caliblocation") || row.original.caliblocation || "Lab";
    const calibacc =
      params.get("calibacc") || row.original.calibacc || "Nabl";

    setConfirmDeleteLoading(true);

    try {
      await axios.delete(
        `/calibrationoperations/calibration-method-destroy/${id}?caliblocation=${encodeURIComponent(
          caliblocation
        )}&calibacc=${encodeURIComponent(calibacc)}`
      );
      table.options.meta?.deleteRow(row);
      setDeleteSuccess(true);
      toast.success("Calibration operation deleted ✅", {
        duration: 1000,
        icon: "🗑️",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(true);
      toast.error("Failed to delete calibration operation ❌", {
        duration: 2000,
      });
    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [row, table, location.search]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  const getNavigationUrl = (path) => {
    const params = new URLSearchParams(location.search);
    const caliblocation =
      params.get("caliblocation") || row.original.caliblocation || "Lab";
    const calibacc =
      params.get("calibacc") || row.original.calibacc || "Nabl";
    return `${path}?caliblocation=${encodeURIComponent(
      caliblocation
    )}&calibacc=${encodeURIComponent(calibacc)}`;
  };

  // Actions list with permissions checked inline
  const actions = [
    ...(row.original.status === -1 && permissions.includes(98)
      ? [
          {
            label: "Add Inward Item",
            color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/add-inward-item/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(201)
      ? [
          {
            label: "Edit CRF Entry Detail",
            color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/edit-inward-entry/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(row.original.status === 0 && permissions.includes(99)
      ? [
          {
            label: "Review Inward",
            color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/review-inward/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(row.original.status === 1 && permissions.includes(100)
      ? [
          {
            label: "Technical Acceptance",
            color: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/technical-acceptance/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(row.original.status === 4 && permissions.includes(97)
      ? [
          {
            label: "Perform Calibration",
            color: "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(374) && row.original.status >= 3
      ? [
          {
            label: "Work Completion Report",
            color: "bg-teal-100 text-teal-800 hover:bg-teal-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/service-report-form/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(406)
      ? [
          {
            label: "Edit Bd Person",
            color: "bg-rose-100 text-rose-800 hover:bg-rose-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/edit-bd-person/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(row.original.status === 2 && permissions.includes(101)
      ? [
          {
            label: "Transfer In lab",
            color: "bg-violet-100 text-violet-800 hover:bg-violet-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/sample-transfer-in-lab/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(372)
      ? [
          {
            label: "SRF View",
            color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/srf-view/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(373)
      ? [
          {
            label: "CRF View",
            color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/crf-view/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(286)
      ? [
          {
            label: "Edit Work Order detail",
            color: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/edit-work-order/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(286) && permissions.includes(297)
      ? [
          {
            label: "Edit Customer Responsible for payment",
            color: "bg-orange-100 text-orange-800 hover:bg-orange-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/edit-customer/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(286) && (permissions.includes(407) || !row.original.invoicecount)
      ? [
          {
            label: "Edit Billing Detail",
            color: "bg-lime-200 text-lime-900 hover:bg-lime-300",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/edit-billing/${row.original.id}`
            ),
          },
        ]
      : []),
    ...(permissions.includes(283) && (!row.original.feedbackid)
      ? [
          {
            label: "Fill Feedback form",
            color: "bg-sky-100 text-sky-800 hover:bg-sky-200",
            to: getNavigationUrl(
              `/dashboards/calibration-process/inward-entry-lab/fill-feedback/${row.original.id}`
            ),
          },
        ]
      : []),
  ];

  const filteredActions = actions;

  return (
    <>
      <div className="flex flex-wrap justify-left gap-1.5">
        {filteredActions.map((action, index) => (
          <Button
            key={index}
            component={Link}
            to={action.to}
            className={clsx(
              "h-7 rounded px-2.5 py-1 text-xs font-medium outline-none transition-all hover:shadow-md",
              action.color
            )}
          >
            <span>{action.label}</span>
          </Button>
        ))}
      </div>

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