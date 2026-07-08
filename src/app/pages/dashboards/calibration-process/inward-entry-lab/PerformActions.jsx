// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// Ensure location is available (e.g., with React Router or window object)
const searchParams =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const calibacc = searchParams.get("calibacc") || "";
console.log(calibacc);

const userId =
  typeof window !== "undefined" ? localStorage.getItem("userId") : null;
console.log("Logged in user id:", userId);

// Simple icons as SVG components
const DocumentArrowUpIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const DocumentTextIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 11.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const DocumentDuplicateIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const XMarkIcon = ({ className }) => (
  <svg
    className={className}
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
);

const ExclamationTriangleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.764 0L3.034 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const ArrowPathIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m-4.991 0v4.994"
    />
  </svg>
);

const WrenchScrewdriverIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
    />
  </svg>
);

const ArrowLeftIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const Cog6ToothIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const DocumentMagnifyingGlassIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L16.5 19.5m-1.699-1.699a7.5 7.5 0 111.699-1.699z"
    />
  </svg>
);

const CertificateIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
    />
  </svg>
);

const CalculatorIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const ClipboardDocumentCheckIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.25-4.875c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0117.25 18.75h-8.5A2.25 2.25 0 016.5 16.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.747-.057 1.124-.08M15 12.75a3 3 0 11-6 0 3 3 0 016 0zm-3-2.25a.75.75 0 00-.75.75v.75h-.75a.75.75 0 000 1.5h.75v.75a.75.75 0 001.5 0v-.75h.75a.75.75 0 000-1.5H12v-.75a.75.75 0 00-.75-.75z"
    />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ArrowDownTrayIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

// Utility function for class names
const clsx = (...classes) => classes.filter(Boolean).join(" ");

export function PerformActions({ item, onAction }) {
  // Theme state for light/dark mode
  const [theme, setTheme] = useState("light");

  // Theme detection
  useEffect(() => {
    // Check if window is defined before accessing it
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "dark" : "light");

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => setTheme(e.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const permissions =
    typeof window !== "undefined"
      ? localStorage.getItem("userPermissions")?.split(",").map(Number) || []
      : [];

  const status = Number(item.status);
  const isAllotedOrAdmin = Boolean(item.allotedto && (userId == item.allotedto || userId == 1));
  const isNabl = Boolean(item.accreditation?.toLowerCase() === "nabl");

  const performActions = [];

  if (status < 1 && (!item.itemdocument || item.itemdocument.length === 0)) {
    performActions.push({
      label: "Upload Document",
      action: "uploadDocument",
      icon: DocumentArrowUpIcon,
      color: "text-blue-600",
      hoverColor: "hover:bg-blue-50 hover:text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    });
  } else if (item.itemdocument && item.itemdocument.length > 0) {
    performActions.push({
      label: "View Documents",
      action: "viewDocuments",
      icon: DocumentTextIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });
  }

  if (status === -1) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Add Crf",
        permission: 113,
        action: "addCrf",
        icon: PlusIcon,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50 hover:text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      });
      performActions.push({
        label: "Clone Item",
        permission: 113,
        action: "cloneItem",
        icon: DocumentDuplicateIcon,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50 hover:text-purple-700",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      });
    }
  } else if (status === 0 || status === 11) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Edit Instrument Detail",
        permission: 114,
        action: "editInstrumentDetail",
        icon: PencilIcon,
        color: "text-indigo-600",
        hoverColor: "hover:bg-indigo-50 hover:text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      });
      performActions.push({
        label: "Calibrate Step 1",
        permission: 103,
        action: "calibrateStep1",
        icon: WrenchScrewdriverIcon,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50 hover:text-teal-700",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
      });
    }
  } else if (status === 1) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Back To Step 1",
        permission: 103,
        action: "backToStep1",
        icon: ArrowLeftIcon,
        color: "text-gray-600",
        hoverColor: "hover:bg-gray-50 hover:text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      });
      performActions.push({
        label: "Edit Instrument Detail",
        permission: 114,
        action: "editInstrumentDetail",
        icon: PencilIcon,
        color: "text-indigo-600",
        hoverColor: "hover:bg-indigo-50 hover:text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      });
      performActions.push({
        label: "Calibrate Step 2",
        permission: 103,
        action: "calibrateStep2",
        icon: WrenchScrewdriverIcon,
        color: "text-teal-700",
        hoverColor: "hover:bg-teal-50 hover:text-teal-800",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
      });
    }
  } else if (status === 2) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Edit Instrument Detail",
        permission: 114,
        action: "editInstrumentDetail",
        icon: PencilIcon,
        color: "text-indigo-600",
        hoverColor: "hover:bg-indigo-50 hover:text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      });
      performActions.push({
        label: "Back To Step 1",
        permission: 103,
        action: "backToStep1",
        icon: ArrowLeftIcon,
        color: "text-gray-600",
        hoverColor: "hover:bg-gray-50 hover:text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      });
      performActions.push({
        label: "Change Master",
        permission: 103,
        action: "changeMaster",
        icon: Cog6ToothIcon,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50 hover:text-pink-700",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
      });
      performActions.push({
        label: "Calibrate Step 3",
        permission: 103,
        action: "calibrateStep3",
        icon: WrenchScrewdriverIcon,
        color: "text-teal-700",
        hoverColor: "hover:bg-teal-50 hover:text-teal-800",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
      });
      performActions.push({
        label: "Edit Calib Point",
        permission: 114,
        action: "editCalibPoint",
        icon: PencilIcon,
        color: "text-violet-600",
        hoverColor: "hover:bg-violet-50 hover:text-violet-700",
        bgColor: "bg-violet-50",
        borderColor: "border-violet-200",
      });
    }
  } else if (status === 3) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Back To Step 1",
        permission: 103,
        action: "backToStep1",
        icon: ArrowLeftIcon,
        color: "text-gray-600",
        hoverColor: "hover:bg-gray-50 hover:text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      });
      performActions.push({
        label: "Edit Instrument Detail",
        permission: 114,
        action: "editInstrumentDetail",
        icon: PencilIcon,
        color: "text-indigo-600",
        hoverColor: "hover:bg-indigo-50 hover:text-indigo-700",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
      });
      performActions.push({
        label: "Edit Calib Point",
        permission: 114,
        action: "editCalibPoint",
        icon: PencilIcon,
        color: "text-violet-600",
        hoverColor: "hover:bg-violet-50 hover:text-violet-700",
        bgColor: "bg-violet-50",
        borderColor: "border-violet-200",
      });
    }

    if (isNabl) {
      performActions.push({
        label: "Calculate Uncertainty",
        permission: 397,
        action: "calculateUncertainty",
        icon: CalculatorIcon,
        color: "text-green-700",
        hoverColor: "hover:bg-green-50 hover:text-green-800",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      });
    }

    performActions.push({
      label: "View Rawdata",
      action: "viewRawdata",
      icon: EyeIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    performActions.push({
      label: "View Certificate",
      permission: [104, 105],
      action: "viewCertificate",
      icon: CertificateIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    if (isNabl) {
      performActions.push({
        label: "View CMC Calculation",
        permission: [104, 105],
        action: "viewCMCCalculation",
        icon: CalculatorIcon,
        color: "text-cyan-600",
        hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-200",
      });
    }

    performActions.push({
      label: "Review",
      permission: [277, 115],
      action: "review",
      icon: ClipboardDocumentCheckIcon,
      color: "text-blue-700",
      hoverColor: "hover:bg-blue-50 hover:text-blue-800",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    });
  } else if (status === 4) {
    performActions.push({
      label: "View Certificate",
      permission: [104, 105, 278],
      action: "viewCertificate",
      icon: CertificateIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    if (isNabl) {
      performActions.push({
        label: "View CMC Calculation",
        permission: [104, 105, 278],
        action: "viewCMCCalculation",
        icon: CalculatorIcon,
        color: "text-cyan-600",
        hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-200",
      });
    }

    performActions.push({
      label: "Approve",
      permission: [278, 105],
      action: "approve",
      icon: CheckIcon,
      color: "text-green-700",
      hoverColor: "hover:bg-green-50 hover:text-green-800",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    });
  } else if (status === 5) {
    performActions.push({
      label: "View Rawdata",
      action: "viewRawdata",
      icon: EyeIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    performActions.push({
      label: "Regenerate Cache Copy",
      permission: [104, 105, 482],
      action: "regenerateCache",
      icon: ArrowDownTrayIcon,
      color: "text-orange-600",
      hoverColor: "hover:bg-orange-50 hover:text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    });

    performActions.push({
      label: "View Certificate",
      permission: [104, 105, 482],
      action: item.fileWithFullPath ? "viewApprovedCertificate" : "viewCertificate",
      icon: CertificateIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    performActions.push({
      label: "View Certificate with l/h",
      permission: [104, 105, 482],
      action: "viewCertificateWithLH",
      icon: CertificateIcon,
      color: "text-cyan-800",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-900",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    if (isNabl) {
      performActions.push({
        label: "View CMC Calculation",
        permission: [104, 105, 482],
        action: "viewCMCCalculation",
        icon: CalculatorIcon,
        color: "text-cyan-600",
        hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-200",
      });
    }

    performActions.push({
      label: "Request Revision",
      permission: 202,
      action: "requestRevision",
      icon: ArrowPathIcon,
      color: "text-orange-600",
      hoverColor: "hover:bg-orange-50 hover:text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    });
  }

  if (status >= 3 && status <= 5) {
    performActions.push({
      label: "View Tracebility",
      action: "viewTraceability",
      icon: DocumentMagnifyingGlassIcon,
      color: "text-cyan-700",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-800",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });
  }

  if (status >= 0 && status <= 2) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Cancel Crf",
        action: "cancelCrf",
        icon: XMarkIcon,
        color: "text-red-600",
        hoverColor: "hover:bg-red-50 hover:text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      });
    }
  }

  if (status >= -1 && status <= 3) {
    performActions.push({
      label: "Request Cancel LRN",
      action: "requestCancelLRN",
      icon: ExclamationTriangleIcon,
      color: "text-red-700",
      hoverColor: "hover:bg-red-50 hover:text-red-800",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    });
  }

  if (status === 81) {
    if (isAllotedOrAdmin) {
      performActions.push({
        label: "Edit Details for revision",
        permission: 105,
        action: "editDetailsForRevision",
        icon: PencilIcon,
        color: "text-yellow-600",
        hoverColor: "hover:bg-yellow-50 hover:text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      });
    }
  }

  if (status === 82) {
    performActions.push({
      label: "View Rawdata",
      action: "viewRawdata",
      icon: EyeIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    performActions.push({
      label: "View Certificate",
      permission: [104, 105],
      action: "viewCertificate",
      icon: CertificateIcon,
      color: "text-cyan-600",
      hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    });

    if (isNabl) {
      performActions.push({
        label: "View CMC Calculation",
        permission: [104, 105],
        action: "viewCMCCalculation",
        icon: CalculatorIcon,
        color: "text-cyan-600",
        hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-200",
      });
    }

    performActions.push({
      label: "Review",
      permission: [277, 115],
      action: "review",
      icon: ClipboardDocumentCheckIcon,
      color: "text-blue-700",
      hoverColor: "hover:bg-blue-50 hover:text-blue-800",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    });
  }

  const filteredActions = performActions.filter(
    (action) =>
      !action.permission ||
      (Array.isArray(action.permission)
        ? action.permission.some((p) => permissions.includes(p))
        : permissions.includes(action.permission)),
  );

  const handleActionClick = (action) => {
    //console.log('PerformActions: Triggering action:', action);
    onAction(action, item);
  };

  return (
    <div className={`${theme === "dark" ? "dark" : ""}`}>
      <div className="justify-left flex flex-wrap gap-2">
        {filteredActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={`${action.action}-${index}`}
              onClick={() => handleActionClick(action.action)}
              className={clsx(
                "btn-base btn h-7 rounded border px-2.5 py-1 text-xs font-medium outline-none transition-all hover:shadow-md",
                action.bgColor || "bg-slate-100",
                action.color || "text-slate-800",
                action.hoverColor || "hover:bg-slate-200",
                action.borderColor,
                "focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 dark:focus:ring-slate-500",
              )}
              title={action.label}
            >
              <IconComponent className="mr-1.5 h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{action.label}</span>
            </button>
          );
        })}

        {filteredActions.length === 0 && (
          <span className="cursor-default px-3 py-1.5 text-sm text-gray-500 italic">
            No actions available
          </span>
        )}
      </div>
    </div>
  );
}

PerformActions.propTypes = {
  item: PropTypes.object.isRequired,
  onAction: PropTypes.func.isRequired,
};