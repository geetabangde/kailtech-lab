// Import Dependencies
import {
  PencilIcon,
  FolderOpenIcon,
  TrashIcon,
  UserIcon,
  BeakerIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ChatBubbleBottomCenterTextIcon,
  PrinterIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useState } from "react";
import PropTypes from "prop-types";

import { ConfirmModal } from "components/shared/ConfirmModal";
import axios from "utils/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";

// ----------------------------------------------------------------------

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this TRF entry? Once deleted, it cannot be restored.",
  },
  success: {
    title: "TRF Entry Deleted",
  },
};

const actionColorClassByLabel = {
  "Add Items": "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  "Sample Review": "bg-amber-100 text-amber-800 hover:bg-amber-200",
  "Technical Acceptance": "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
  "Allot Sample": "bg-violet-100 text-violet-800 hover:bg-violet-200",
  "Assign Chemist": "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
  Details: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "Perform Testing": "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200",
  "View Draft Report": "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
  "HOD Review": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "QA Review": "bg-teal-100 text-teal-800 hover:bg-teal-200",
  "Generate ULR": "bg-purple-100 text-purple-800 hover:bg-purple-200",
  "View Reports": "bg-green-100 text-green-800 hover:bg-green-200",
  "Print Slip": "bg-pink-100 text-pink-800 hover:bg-pink-200",
  "Edit TRF": "bg-yellow-200 text-yellow-900 hover:bg-yellow-300",
  "Edit Work Order detail": "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
  "Edit Billing Detail": "bg-lime-200 text-lime-900 hover:bg-lime-300",
  "Edit Customer Responsible for Payment":
    "bg-orange-100 text-orange-800 hover:bg-orange-200",
  "Edit BD Person": "bg-rose-100 text-rose-800 hover:bg-rose-200",
  "Fill Feedback Form": "bg-sky-100 text-sky-800 hover:bg-sky-200",
};

function ActionPill({
  onClick,
  href,
  icon: Icon,
  label,
  danger = false,
  colorClass,
}) {
  const handleClick = (e) => {
    // Allow right-click, middle-click, Ctrl+Click, Cmd+Click for new tab
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }

    // Normal left-click: prevent default and use navigate
    if (href && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const Element = href ? "a" : "button";
  const props = href ? { href, onClick: handleClick } : { onClick };

  return (
    <Element
      {...props}
      className={clsx(
        "box-border inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs leading-none font-medium no-underline shadow-sm transition-all duration-150",
        danger
          ? "bg-red-100 text-red-800 hover:bg-red-200"
          : colorClass || "bg-slate-100 text-slate-800 hover:bg-slate-200",
      )}
    >
      <Icon className="size-3.5 shrink-0 stroke-[1.5]" />
      <span className="whitespace-nowrap">{label}</span>
    </Element>
  );
}

export function RowActions({ row, table, wrap = false }) {
  const navigate = useNavigate();

  const trfId = row.original.id;
  const status = Number(row.original.status);

  // ✅ hasProducts — multiple fields se check karo
  const hasProducts =
    !!row.original.products_display ||
    !!row.original.brn_nos_display ||
    !!row.original.lrn_nos_display ||
    (Array.isArray(row.original.products) && row.original.products.length > 0);

  // Permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const closeModal = () => setDeleteModalOpen(false);
  const openModal = () => {
    setDeleteModalOpen(true);
    setDeleteError(false);
    setDeleteSuccess(false);
  };

  const handleDeleteTrf = useCallback(async () => {
    setConfirmDeleteLoading(true);
    try {
      await axios.delete(`/testing/delete-trf?id=${trfId}`);
      table.options.meta?.deleteRow(row);
      setDeleteSuccess(true);
      toast.success("TRF entry deleted successfully ✅", {
        duration: 1000,
        icon: "🗑️",
      });
      setTimeout(() => setDeleteModalOpen(false), 1000);
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(true);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete TRF entry";
      toast.error(`${errorMessage} ❌`, { duration: 2000 });
    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [row, table, trfId]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";
  const base = `/dashboards/testing/trfs-starts-jobs`;

  // ✅ Navigation with state support + href for right-click new tab
  const go = (path) => ({
    href: path,
    onClick: () => navigate(path, { state: { trfStatus: status } }),
  });

  const actions = [
    // Add Items — status 0 or 98, permission 98
    ...(status === 0 || status === 98
      ? [
        {
          label: "Add Items",
          icon: FolderOpenIcon,
          permission: 98,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // Sample Review — status 1
    ...(status === 1
      ? [
        {
          label: "Sample Review",
          icon: DocumentMagnifyingGlassIcon,
          permission: 125,
          ...go(`${base}/samplereview/${trfId}`),
        },
      ]
      : []),

    // Technical Acceptance — status 2
    ...(status === 2
      ? [
        {
          label: "Technical Acceptance",
          icon: ClipboardDocumentCheckIcon,
          permission: 126,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // Allot Sample — status 3
    ...(status === 3
      ? [
        {
          label: "Allot Sample",
          icon: BeakerIcon,
          permission: 128,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // Assign Chemist — status 3 or 4
    ...(status === 3 || status === 4
      ? [
        {
          label: "Assign Chemist",
          icon: UserIcon,
          permission: 6,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // Details — always visible
    {
      label: "Details",
      icon: DocumentTextIcon,
      ...go(`${base}/trfitems/${trfId}`),
    },

    // Perform Testing — status 5
    ...(status === 5
      ? [
        {
          label: "Perform Testing",
          icon: ClipboardDocumentCheckIcon,
          anyPermission: [7, 182],
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // View Draft Report — status 6
    ...(status === 6
      ? [
        {
          label: "View Draft Report",
          icon: DocumentTextIcon,
          permission: 179,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // HOD Review — status 7
    ...(status === 7
      ? [
        {
          label: "HOD Review",
          icon: ClipboardDocumentCheckIcon,
          permission: 180,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // QA Review — status 8
    ...(status === 8
      ? [
        {
          label: "QA Review",
          icon: ClipboardDocumentCheckIcon,
          permission: 181,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // Generate ULR — status 9
    ...(status === 9
      ? [
        {
          label: "Generate ULR",
          icon: DocumentTextIcon,
          permission: 182,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // View Reports — status 10
    ...(status === 10
      ? [
        {
          label: "View Reports",
          icon: FolderOpenIcon,
          permission: 182,
          ...go(`${base}/trfitems/${trfId}`),
        },
      ]
      : []),

    // Print Slip — status > 3
    ...(status > 3
      ? [
        {
          label: "Print Slip",
          icon: PrinterIcon,
          ...go(`${base}/slip/${trfId}`),
        },
      ]
      : []),

    // Edit TRF — status < 10 or 98
    ...(status < 10 || status === 98
      ? [
        {
          label: "Edit TRF",
          icon: PencilIcon,
          permission: 2,
          ...go(`${base}/edit/${trfId}`),
        },
      ]
      : []),

    // Edit Work Order
    {
      label: "Edit Work Order detail",
      icon: DocumentTextIcon,
      permission: 284,
      ...go(`${base}/addPoDetailToTrf/${trfId}`),
    },

    // Edit Billing Detail
    {
      label: "Edit Billing Detail",
      icon: BanknotesIcon,
      permission: 284,
      ...go(`${base}/editBillingDetailTrf/${trfId}`),
    },

    // Edit Customer Responsible
    {
      label: "Edit Customer Responsible for Payment",
      icon: UserIcon,
      permission: 297,
      ...go(`${base}/editmaincustomerTrf/${trfId}`),
    },

    // Edit BD Person
    {
      label: "Edit BD Person",
      icon: PencilIcon,
      permission: 406,
      ...go(`${base}/edit_bd_person/${trfId}`),
    },

    // Fill Feedback Form
    {
      label: "Fill Feedback Form",
      icon: ChatBubbleBottomCenterTextIcon,
      permission: 283,
      ...go(`${base}/customerFeedbackForm/${trfId}`),
    },
  ];

  const filteredActions = actions.filter((action) => {
    if (action.anyPermission) {
      return action.anyPermission.some((p) => permissions.includes(p));
    }
    if (action.permission) {
      return permissions.includes(action.permission);
    }
    return true;
  });

  return (
    <>
      <div className={clsx("flex flex-wrap gap-1.5 py-1", wrap && "flex-wrap")}>
        {filteredActions.map((action, index) => (
          <ActionPill
            key={index}
            href={action.href}
            onClick={action.onClick}
            icon={action.icon}
            label={action.label}
            colorClass={actionColorClassByLabel[action.label]}
          />
        ))}

        {permissions.includes(395) && !hasProducts && (
          <ActionPill
            onClick={openModal}
            icon={TrashIcon}
            label="Delete"
            danger
          />
        )}
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDeleteTrf}
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
