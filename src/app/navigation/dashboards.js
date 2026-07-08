import { HomeIcon } from "@heroicons/react/24/outline";
import BtcIcon from "assets/nav-icons/btc.svg?react";
import PersonalChartIcon from "assets/nav-icons/personal-chart.svg?react";
import Statistic2Icon from "assets/nav-icons/statistic-2.svg?react";
import MegaphoneIcon from "assets/nav-icons/megaphone.svg?react";
import BankBuildIcon from "assets/nav-icons/bank-build.svg?react";
import WindowIcon from "assets/nav-icons/window.svg?react";
import MapIcon from "assets/nav-icons/map.svg?react";
import StudentIcon from "assets/nav-icons/student.svg?react";
import DashboardsIcon from "assets/dualicons/dashboards.svg?react";
import StethoscopeIcon from "assets/nav-icons/stethoscope.svg?react";
import PeopleIcon from "assets/nav-icons/people.svg?react";
import PeopleEditIcon from "assets/nav-icons/people-edit.svg?react";
import PeopleMonitorIcon from "assets/nav-icons/people-monitor.svg?react";
import TeacherIcon from "assets/nav-icons/teacher.svg?react";
import MonitorIcon from "assets/nav-icons/monitor.svg?react";
import ProjectBoardIcon from "assets/nav-icons/project-board.svg?react";
import WidgetIcon from "assets/nav-icons/widget.svg?react";
import HooksIcon from "assets/nav-icons/hooks.svg?react";
import UtilityIcon from "assets/nav-icons/utility.svg?react";
import { SettingsIcon } from "lucide-react";

import {
  NAV_TYPE_ROOT,
  NAV_TYPE_ITEM,
  NAV_TYPE_COLLAPSE,
} from "constants/app.constant";

const ROOT_DASHBOARDS = "/dashboards";

const path = (root, item) => `${root}${item}`;

const DASHBOARD_PERMISSION_RULES = {
  "/dashboards/master-data": [382, 381, 79, 87, 74, 69, 343],
  "/dashboards/master-data/unit-types": [87],
  "/dashboards/master-data/modes": [87],
  "/dashboards/master-data/tax-slabs": [79],
  "/dashboards/master-data/verticals": [79],
  "/dashboards/master-data/document-master": [74],
  "/dashboards/master-data/currencies": [79],
  "/dashboards/master-data/units": [79],
  "/dashboards/master-data/statuary-detail": [79],
  "/dashboards/master-data/units-conversion": [79],
  "/dashboards/master-data/manage-labs": [87],
  "/dashboards/master-data/view-activity-log": [381],
  "/dashboards/master-data/master-calibration-return": [69],
  "/dashboards/master-data/general-checklists": [382],
  "/dashboards/calibration-operations": [87, 204, 380, 83],
  "/dashboards/calibration-operations/calibration-standards": [87],
  "/dashboards/calibration-operations/calibration-methods": [87],
  "/dashboards/calibration-operations/bio-medical-visual-test": [87],
  "/dashboards/calibration-operations/bio-medical-safety-test": [87],
  "/dashboards/calibration-operations/instrument-list": [87],
  "/dashboards/calibration-operations/discipline": [87],
  "/dashboards/calibration-operations/revision-requests": [204],
  "/dashboards/calibration-operations/lrn-cancel-requests": [380],
  "/dashboards/calibration-operations/cmc-scope-sheet": [83],
  "/dashboards/calibration-process": [368, 97, 369, 370, 112, 110, 109, 481],
  "/dashboards/calibration-process/inward-entry-lab": [368, 97, 369, 370],
  "/dashboards/calibration-process/inward-entry-lab?caliblocation=lab&calibacc=nabl":
    [368],
  "/dashboards/calibration-process/inward-entry-lab?caliblocation=lab&calibacc=non nabl":
    [97],
  "/dashboards/calibration-process/inward-entry-lab?caliblocation=site&calibacc=nabl":
    [369],
  "/dashboards/calibration-process/inward-entry-lab?caliblocation=site&calibacc=non nabl":
    [370],
  "/dashboards/calibration-process/dispatch-list": [112],
  "/dashboards/calibration-process/dispatch-register": [112],
  "/dashboards/calibration-process/ulr-list": [110],
  "/dashboards/calibration-process/lrn-brn-register": [109],
  "/dashboards/calibration-process/lead-managements": [481],
  "/dashboards/testing": [189, 200, 190, 191, 194, 195, 196, 197, 198, 199],
  "/dashboards/testing/products": [189],
  "/dashboards/testing/product-grades": [190],
  "/dashboards/testing/product-size": [191],
  "/dashboards/testing/measurements": [194],
  "/dashboards/testing/standards": [195],
  "/dashboards/testing/test-methods": [196],
  "/dashboards/testing/test-clauses": [197],
  "/dashboards/testing/test-parameters": [198],
  "/dashboards/testing/test-permissible-values": [199],
  "/dashboards/testing/trfs-starts-jobs": [200],
  "/dashboards/testing/lrn-cancel-requests": [330],
  "/dashboards/testing/revision-requests": [412],
  "/dashboards/testing/dispatch-list": [307],
  "/dashboards/action-items": [128, 288, 6, 7, 179, 180, 181, 137],
  "/dashboards/action-items/pending-technical-acceptance": [126],
  "/dashboards/action-items/allot-sample": [128],
  "/dashboards/action-items/accept-sample": [288],
  "/dashboards/action-items/assign-chemist": [6],
  "/dashboards/action-items/perform-testing": [7],
  "/dashboards/action-items/view-draft-report": [179],
  "/dashboards/action-items/review-by-hod": [180],
  "/dashboards/action-items/review-by-qa": [181],
  "/dashboards/action-items/generate-ulr": [137],
  "/dashboards/action-items/pending-upload-reports": [333],
  "/dashboards/action-items/final-reports-unsigned": [137],
  "/dashboards/action-items/signed-reports": [137],
  "/dashboards/approvals": [392, 393, 403],
  "/dashboards/approvals/priority-approval": [392],
  "/dashboards/approvals/payment-approval-testing": [392],
  "/dashboards/approvals/payment-approval-calibration": [392],
  "/dashboards/approvals/payment-hold-notification-1": [403],
  "/dashboards/approvals/payment-approval-2": [403],
  "/dashboards/approvals/witness-approval": [392],
  "/dashboards/approvals/witness-lock": [393],
  "/dashboards/approvals/payment-hold-notification-2": [403],
  "/dashboards/approvals/calibration-payment-approval-2": [403],
  "/dashboards/sales": [164, 91, 385, 140, 141, 165],
  "/dashboards/sales/website-enquiry": [385],
  "/dashboards/sales/enquiry": [91],
  "/dashboards/sales/test-packages": [164],
  "/dashboards/sales/calibrations-quotations": [93],
  "/dashboards/sales/testing-quotations": [141],
  "/dashboards/role-management": [169, 168, 166],
  "/dashboards/role-management/modules": [169],
  "/dashboards/role-management/roles": [168],
  "/dashboards/role-management/permissions": [168],
  "/dashboards/role-management/process-guide": [166],
  "/dashboards/role-management/organisation-setting": [377],
  "/dashboards/records/lrn-brn-register": [109],
  "/dashboards/records/environmental-record": [411],
  "/dashboards/records/equipment-list": [355],
  "/dashboards/records/calibration-schedule-period": [354],
  "/dashboards/records/dispatch-register": [162],
  "/dashboards/records/service-report-list": [108],
  "/dashboards/records/ulr-list": [110],
  "/dashboards/records/cmc-scope-sheet": [83],
  "/dashboards/records/sample-inward-register": [160],
  "/dashboards/records/calibration-crf-srf": [372, 373],
  "/dashboards/records/calibration-crf-srf-non-nabl": [372, 373],
  "/dashboards/registers/assigned-calibration-register": [478],
  "/dashboards/registers/testing-track-report": [479],
  "/dashboards/registers/calibration-track-report": [480],
  "/dashboards/registers/pending-for-testing-lrn-wise": [156],
  "/dashboards/registers/pending-for-testing-parameter-wise": [156],
  "/dashboards/registers/parameter-wise-status-list": [156],
  "/dashboards/registers/ulr-register": [159],
  "/dashboards/registers/alloted-items": [158],
  "/dashboards/registers/sample-inward-register": [160],
  "/dashboards/registers/bis-sample-inward-register": [161],
  "/dashboards/registers/received-register": [160, 161],
  "/dashboards/registers/remnant-register": [163],
  "/dashboards/registers/dispatch-register": [162],
  "/dashboards/registers/disposal-register": [353],
  "/dashboards/registers/bis-disposal-register": [353],
  "/dashboards/registers/calibration-schedule-period": [354],
  "/dashboards/registers/equipment-list": [355],
  "/dashboards/registers/crm-list": [356],
  "/dashboards/registers/pending-samples": [357],
  "/dashboards/registers/environmental-condition": [411],
  "/dashboards/inventory": [302, 401, 170, 192, 134, 136, 150, 287, 172, 173, 174],
  "/dashboards/inventory/categories": [170],
  "/dashboards/inventory/subcategories": [192],
  "/dashboards/inventory/product-type-stock": [192],
  "/dashboards/inventory/purchase-requisition": [134, 136, 150],
  "/dashboards/inventory/purchase-order": [287],
  "/dashboards/inventory/mrn": [172],
  "/dashboards/inventory/pending-for-coding": [172],
  "/dashboards/inventory/pending-location": [172],
  "/dashboards/inventory/pending-verification": [396],
  "/dashboards/inventory/stock": [173],
  "/dashboards/inventory/din-list": [302],
  "/dashboards/inventory/dispatch-return": [315],
  "/dashboards/inventory/instrument-transfer": [399],
  "/dashboards/inventory/create-solutions": [401],
  "/dashboards/inventory/issue-return": [174],
  "/dashboards/people": [183, 184, 169, 155, 153, 187, 188],
  "/dashboards/people/customer-categories": [183],
  "/dashboards/people/customer-types": [184],
  "/dashboards/people/specific-purposes": [169],
  "/dashboards/people/customers": [155],
  "/dashboards/people/promoters": [153],
  "/dashboards/people/suppliers": [187],
  "/dashboards/people/users": [412],
  "/dashboards/profile/din-list": [301],
  "/dashboards/profile/request-new-customer": [360],
  "/dashboards/profile/my-department-stock": [347],
  "/dashboards/profile/my-sales-report": [309],
  "/dashboards/profile/invoice-report": [338],
  "/dashboards/profile/payment-report": [339],
  "/dashboards/profile/mom-list": [439],
  "/dashboards/profile/my-kra": [442],
  "/dashboards/profile/customer-complaint-record": [444],
  "/dashboards/profile/non-confirming-record": [451],
  "/dashboards/profile/raise-incidence-deviation": [453],
  "/dashboards/profile/incidence-deviation-record": [453],
  "/dashboards/accounts/payment-list": [275],
  "/dashboards/accounts/payment-list-party-wise": [275],
  "/dashboards/accounts/testing-unbilled-items": [143],
  "/dashboards/accounts/calibration-unbilled-items": [146],
  "/dashboards/accounts/proforma-invoice": [41],
  "/dashboards/accounts/calibration-invoice-list": [146],
  "/dashboards/accounts/testing-invoices": [143],
  "/dashboards/accounts/past-invoices": [299],
  "/dashboards/accounts/canceled-invoices": [143],
  "/dashboards/accounts/invoice-cancelation-request": [340],
  "/dashboards/accounts/credit-note": [334],
  "/dashboards/accounts/invoice-report": [146],
  "/dashboards/accounts/complete-ledger": [146],
  "/dashboards/accounts/sales-report": [146],
  "/dashboards/accounts/gstr-1": [146],
  "/dashboards/accounts/consent-letter": [362],
  "/dashboards/hrm/manage-branch": [209],
  "/dashboards/hrm/manage-departments": [213],
  "/dashboards/hrm/manage-designations": [217],
  "/dashboards/hrm/manage-policies": [221],
  "/dashboards/hrm/salary-structure-design": [225],
  "/dashboards/hrm/professional-tax": [229],
  "/dashboards/hrm/view-all-attendance": [230],
  "/dashboards/hrm/view-all-leaves": [231],
  "/dashboards/hrm/manage-leave-rules": [234],
  "/dashboards/hrm/view-attendance-policies": [238],
  "/dashboards/hrm/add-attendance-policy": [241],
  "/dashboards/hrm/holidays": [242],
  "/dashboards/hrm/view-offer-letters-list": [246],
  "/dashboards/hrm/manage-employee": [188],
  "/dashboards/hrm/approve-employee": [233],
  "/dashboards/hrm/employee-termination": [209],
  "/dashboards/hrm/pending-appraisal-list": [256],
  "/dashboards/training": [198, 201, 202],
  "/dashboards/training/employees-in-induction": [198],
  "/dashboards/training/employee-pending-for-training": [201],
  "/dashboards/training/employee-in-training": [202],
  "/dashboards/gate-entry/gate-entry": [289],
  "/dashboards/gate-entry/issued-entry": [296],
  "/dashboards/quality-documents": [467, 469, 468],
  "/dashboards/quality-documents/role-request": [467],
  "/dashboards/quality-documents/verification-lims": [469],
  "/dashboards/quality-documents/quality-objectives": [468],
};

const normalizeQueryParams = (query = "") => {
  if (!query) return "";

  const params = new URLSearchParams(query);
  const normalizedEntries = [...params.entries()].map(([key, value]) => [
    String(key).trim().toLowerCase(),
    String(value).trim().toLowerCase(),
  ]);

  normalizedEntries.sort((a, b) => {
    const keyCompare = a[0].localeCompare(b[0]);
    if (keyCompare !== 0) return keyCompare;
    return a[1].localeCompare(b[1]);
  });

  const normalizedParams = new URLSearchParams();
  normalizedEntries.forEach(([key, value]) => {
    normalizedParams.append(key, value);
  });

  return normalizedParams.toString();
};

const normalizeRouteKey = (route = "") => {
  if (!route) return "";

  const [rawPath = "", rawQuery = ""] = route.split("?");
  const normalizedPath =
    rawPath.trim().toLowerCase().replace(/\/+$/, "") || "/";
  const normalizedQuery = normalizeQueryParams(rawQuery);

  return normalizedQuery
    ? `${normalizedPath}?${normalizedQuery}`
    : normalizedPath;
};

const normalizePermissionValue = (value) => {
  const numericPermission = Number(value);
  return Number.isFinite(numericPermission) ? numericPermission : null;
};

export const normalizePermissions = (rawPermissions) => {
  if (Array.isArray(rawPermissions)) {
    return [...new Set(rawPermissions.map(normalizePermissionValue).filter(Boolean))];
  }

  if (rawPermissions == null) return [];

  if (typeof rawPermissions === "number") {
    return Number.isFinite(rawPermissions) ? [rawPermissions] : [];
  }

  let rawValue = String(rawPermissions).trim();
  if (!rawValue) return [];

  // If encased in quotes entirely (e.g., `"1,2,3"`), strip them.
  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    rawValue = rawValue.slice(1, -1);
  } else if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
    rawValue = rawValue.slice(1, -1);
  }

  try {
    // If it was already a valid JSON array string
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.map(normalizePermissionValue).filter(Boolean))];
    }
    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return [parsed];
    }
    if (typeof parsed === "string") {
      rawValue = parsed.trim();
    }
  } catch {
    // Fallback to CSV-style parsing.
  }

  return [
    ...new Set(
      rawValue
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((permission) => normalizePermissionValue(permission))
        .filter(Boolean),
    ),
  ];
};

export const getStoredPermissions = () => {
  if (typeof window === "undefined") return [];
  return normalizePermissions(window.localStorage.getItem("userPermissions"));
};

const hasAnyPermission = (permissions = [], requiredPermissions = []) => {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.some((permission) => permissions.includes(permission));
};

const DASHBOARD_PERMISSION_RULE_ENTRIES = Object.entries(
  DASHBOARD_PERMISSION_RULES,
).map(([route, requiredPermissions]) => ({
  route: normalizeRouteKey(route),
  requiredPermissions,
}));

const DASHBOARD_PERMISSION_RULE_MAP = new Map(
  DASHBOARD_PERMISSION_RULE_ENTRIES.map(({ route, requiredPermissions }) => [
    route,
    requiredPermissions,
  ]),
);

const splitRoute = (route = "") => {
  const [pathPart = "", queryPart = ""] = route.split("?");
  return { pathPart, queryPart };
};

const isRouteMatched = (currentRoute, ruleRoute) => {
  const { pathPart: currentPath, queryPart: currentQuery } =
    splitRoute(currentRoute);
  const { pathPart: rulePath, queryPart: ruleQuery } = splitRoute(ruleRoute);

  if (ruleQuery) {
    return currentPath === rulePath && currentQuery === ruleQuery;
  }

  return (
    currentPath === rulePath || currentPath.startsWith(`${rulePath}/`)
  );
};

const filterDashboardItemsByPermissions = (items, permissions) => {
  return items.reduce((allowedItems, item) => {
    const requiredPermissions = item.path
      ? DASHBOARD_PERMISSION_RULE_MAP.get(normalizeRouteKey(item.path))
      : null;

    if (requiredPermissions && !hasAnyPermission(permissions, requiredPermissions)) {
      return allowedItems;
    }

    const nextItem = { ...item };

    if (Array.isArray(item.childs)) {
      nextItem.childs = filterDashboardItemsByPermissions(item.childs, permissions);

      if (item.type === NAV_TYPE_COLLAPSE && nextItem.childs.length === 0) {
        return allowedItems;
      }
    }

    allowedItems.push(nextItem);
    return allowedItems;
  }, []);
};

export const canAccessDashboardsRoute = ({
  pathname = "",
  search = "",
  permissions = [],
} = {}) => {
  const normalizedRoute = normalizeRouteKey(`${pathname}${search}`);
  const normalizedPermissions = normalizePermissions(permissions);
  const matchedRules = DASHBOARD_PERMISSION_RULE_ENTRIES.filter(({ route }) =>
    isRouteMatched(normalizedRoute, route),
  );

  return matchedRules.every(({ requiredPermissions }) =>
    hasAnyPermission(normalizedPermissions, requiredPermissions),
  );
};

// Function to generate dynamic dashboard config
export const generateDashboardsConfig = (labs = [], userPermissions = []) => {
  const permissions = normalizePermissions(userPermissions);
  const employeeId = Number(localStorage.getItem("userId") || 0);

  // Generate child items dynamically from API data
  const materialListChildren = labs
    .filter((lab) => lab.users && lab.users.includes(employeeId))
    .map((lab) => ({
      id: `dashboards.${lab.slug}`,
      type: NAV_TYPE_ITEM,
      path: path(ROOT_DASHBOARDS, `/material-list/${lab.slug}?labId=${lab.id}`),
      title: lab.name,
      // transKey: `nav.dashboards.${lab.slug}`,
    }));

  const dashboardsConfig = {
    id: "dashboards",
    type: NAV_TYPE_ROOT,
    path: "/dashboards",
    title: "Dashboards",
    transKey: "nav.dashboards.dashboards",
    Icon: DashboardsIcon,
    childs: [
      {
        id: "dashboards.home",
        path: path(ROOT_DASHBOARDS, "/home"),
        type: NAV_TYPE_ITEM,
        title: "Dashboards",
        transKey: "nav.dashboards.home",
        Icon: HomeIcon,
      },
      {
        id: "dashboards.material-list",
        path: path(ROOT_DASHBOARDS, "/material-list"),
        type: NAV_TYPE_COLLAPSE,
        title: "Material List",
        transKey: "nav.dashboards.material-list",
        Icon: WindowIcon,
        childs: materialListChildren,
      },

      //---------------new update prateek----------------

      {
        id: "dashboards.operations",
        path: path(ROOT_DASHBOARDS, "/operations"),
        type: NAV_TYPE_COLLAPSE,
        title: "Operations",
        transKey: "nav.dashboards.operations",
        Icon: SettingsIcon,
        childs: [
          {
            id: "dashboards.observation-settings",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/operations/observation-settings"),
            title: "Observation Settings",
            transKey: "nav.dashboards.observation-settings",
          },
        ],
      },

      {
        id: "dashboards.master-data",
        path: path(ROOT_DASHBOARDS, "/master-data"),
        type: NAV_TYPE_COLLAPSE,
        title: "Master Data",
        transKey: "nav.dashboards.master-data",
        Icon: HooksIcon,
        childs: [
          {
            id: "dashboards.unit-types",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/unit-types"),
            title: "Unit Types / Parameters",
            transKey: "nav.dashboards.unit-types",
          },
          {
            id: "dashboards.modes",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/modes"),
            title: "Modes",
            transKey: "nav.dashboards.modes",
          },
          {
            id: "dashboards.tax-slabs",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/tax-slabs"),
            title: "Tax Slabs",
            transKey: "nav.dashboards.tax-slabs",
          },
          {
            id: "dashboards.verticals",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/verticals"),
            title: "Verticals",
            transKey: "nav.dashboards.verticals",
          },
          {
            id: "dashboards.document-master",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/document-master"),
            title: "Document Master",
            transKey: "nav.dashboards.document-master",
          },
          {
            id: "dashboards.currencies",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/currencies"),
            title: "Currencies",
            transKey: "nav.dashboards.currencies",
          },
          {
            id: "dashboards.units",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/units"),
            title: "Units",
            transKey: "nav.dashboards.units",
          },
          {
            id: "dashboards.statuary-detail",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/statuary-detail"),
            title: "Statuary Detail",
            transKey: "nav.dashboards.statuary-detail",
          },
          {
            id: "dashboards.units-conversion",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/units-conversion"),
            title: "Units Conversion",
            transKey: "nav.dashboards.units-conversion",
          },
          {
            id: "dashboards.manage-labs",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/manage-labs"),
            title: "Manage Labs",
            transKey: "nav.dashboards.manage-labs",
          },
          {
            id: "dashboards.view-activity-log",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/view-activity-log"),
            title: "View Activity Log",
            transKey: "nav.dashboards.view-activity-log",
          },
          {
            id: "dashboards.master-calibration-return",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/master-data/master-calibration-return",
            ),
            title: "Master Calibration Return",
            transKey: "nav.dashboards.master-calibration-return",
          },
          {
            id: "dashboards.general-checklists",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/master-data/general-checklists"),
            title: "General Checklists",
            transKey: "nav.dashboards.general-checklists",
          },
        ],
      },
      {
        id: "dashboards.calibration-operations",
        path: path(ROOT_DASHBOARDS, "/calibration-operations"),
        type: NAV_TYPE_COLLAPSE,
        title: "Calibration Operations",
        transKey: "nav.dashboards.calibration-operations",
        Icon: PersonalChartIcon, // replace with appropriate icon
        childs: [
          {
            id: "dashboards.calibration-standards",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/calibration-standards",
            ),
            title: "Calibration Standards",
            transKey: "nav.dashboards.calibration-standards",
          },
          {
            id: "dashboards.calibration-methods",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/calibration-methods",
            ),
            title: "Calibration Methods/SOP",
            transKey: "nav.dashboards.calibration-methods",
          },
          {
            id: "dashboards.bio-medical-visual-test",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/bio-medical-visual-test",
            ),
            title: "Bio Medical Visual Test",
            transKey: "nav.dashboards.bio-medical-visual-test",
          },
          {
            id: "dashboards.bio-medical-safety-test",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/bio-medical-safety-test",
            ),
            title: "Bio Medical Electrical Safety Test",
            transKey: "nav.dashboards.bio-medical-safety-test",
          },
          {
            id: "dashboards.instrument-list",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/instrument-list",
            ),
            title: "Calibration List Of Instrument",
            transKey: "nav.dashboards.instrument-list",
          },
          {
            id: "dashboards.discipline",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/calibration-operations/discipline"),
            title: "Discipline",
            transKey: "nav.dashboards.discipline",
          },
          {
            id: "dashboards.revision-requests",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/revision-requests",
            ),
            title: "Revision Requests",
            transKey: "nav.dashboards.revision-requests",
          },
          {
            id: "dashboards.lrn-cancel-requests",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/lrn-cancel-requests",
            ),
            title: "Lrn Cancel Requests",
            transKey: "nav.dashboards.lrn-cancel-requests",
          },
          {
            id: "dashboards.cmc-scope-sheet",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-operations/cmc-scope-sheet",
            ),
            title: "CMC Scope Sheet",
            transKey: "nav.dashboards.cmc-scope-sheet",
          },
        ],
      },
      {
        id: "dashboards.calibration-process",
        path: path(ROOT_DASHBOARDS, "/calibration-process"),
        type: NAV_TYPE_COLLAPSE,
        title: "Calibration Process",
        transKey: "nav.dashboards.calibration-process",
        Icon: BankBuildIcon, // Replace this with your actual icon
        childs: [
          {
            id: "dashboards.inward-entry-lab",
            type: NAV_TYPE_ITEM,
            path: `${path(ROOT_DASHBOARDS, "/calibration-process/inward-entry-lab")}?caliblocation=Lab&calibacc=Nabl`,

            // path: path(ROOT_DASHBOARDS, '/calibration-process/inward-entry-lab?caliblocation=Lab&calibacc=Nabl'),
            title: "Inward Entry Lab",
            transKey: "nav.dashboards.inward-entry-lab",
          },
          {
            id: "dashboards.inward-entry-lab-non-nabl",
            type: NAV_TYPE_ITEM,
            path: `${path(ROOT_DASHBOARDS, "/calibration-process/inward-entry-lab")}?caliblocation=Lab&calibacc=Non Nabl`,

            // path: path(ROOT_DASHBOARDS, '/calibration-process/inward-entry-lab?caliblocation=Lab&calibacc= Non Nabl'),
            title: "Inward Entry Lab Non Nabl",
            transKey: "nav.dashboards.inward-entry-lab-non-nabl",
          },
          {
            id: "dashboards.inward-entry-site",
            type: NAV_TYPE_ITEM,
            path: `${path(ROOT_DASHBOARDS, "/calibration-process/inward-entry-lab")}?caliblocation=site&calibacc=Nabl`,

            title: "Inward Entry Site",
            transKey: "nav.dashboards.inward-entry-site",
          },
          {
            id: "dashboards.inward-entry-site-non-nabl",
            type: NAV_TYPE_ITEM,
            path: `${path(ROOT_DASHBOARDS, "/calibration-process/inward-entry-lab")}?caliblocation=site&calibacc=Non Nabl`,

            // path: path(ROOT_DASHBOARDS, '/calibration-process/inward-entry-lab?caliblocation=site&calibacc=Non Nabl'),
            title: "Inward Entry Site Non Nabl",
            transKey: "nav.dashboards.inward-entry-site-non-nabl",
          },
          {
            id: "dashboards.dispatch-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/calibration-process/dispatch-list"),
            title: "Dispatch List",
            transKey: "nav.dashboards.dispatch-list",
          },
          {
            id: "dashboards.dispatch-register",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-process/dispatch-register",
            ),
            title: "Dispatch Register",
            transKey: "nav.dashboards.dispatch-register",
          },
          {
            id: "dashboards.ulr-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/calibration-process/ulr-list"),
            title: "ULR List",
            transKey: "nav.dashboards.ulr-list",
          },
          {
            id: "dashboards.lrn-brn-register",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-process/lrn-brn-register",
            ),
            title: "LRN BRN Register",
            transKey: "nav.dashboards.lrn-brn-register",
          },
          {
            id: "dashboards.lead-managements",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/calibration-process/lead-managements",
            ),
            title: "Lead Managements",
            transKey: "nav.dashboards.lead-managements",
          },
        ],
      },
      {
        id: "dashboards.testing",
        path: path(ROOT_DASHBOARDS, "/testing"),
        type: NAV_TYPE_COLLAPSE,
        title: "Testing",
        transKey: "nav.dashboards.testing",
        Icon: MapIcon, // Replace with your actual icon
        childs: [
          {
            id: "dashboards.products",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/products"),
            title: "Products",
            transKey: "nav.dashboards.products",
          },
          {
            id: "dashboards.product-grades",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/product-grades"),
            title: "Product Grades",
            transKey: "nav.dashboards.product-grades",
          },
          {
            id: "dashboards.product-size",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/product-size"),
            title: "Product Sizes",
            transKey: "nav.dashboards.product-size",
          },
          {
            id: "dashboards.measurements",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/measurements"),
            title: "Measurements",
            transKey: "nav.dashboards.measurements",
          },
          {
            id: "dashboards.standards",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/standards"),
            title: "Standards",
            transKey: "nav.dashboards.standards",
          },
          {
            id: "dashboards.test-methods",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/test-methods"),
            title: "Test Methods",
            transKey: "nav.dashboards.test-methods",
          },
          {
            id: "dashboards.test-clauses",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/test-clauses"),
            title: "Test Clauses",
            transKey: "nav.dashboards.test-clauses",
          },
          {
            id: "dashboards.test-parameters",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/test-parameters"),
            title: "Test Parameters",
            transKey: "nav.dashboards.test-parameters",
          },
          {
            id: "dashboards.test-permissible-values",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/test-permissible-values"),
            title: "Test Permissible Values",
            transKey: "nav.dashboards.test-permissible-values",
          },
          {
            id: "dashboards.trfs-starts-jobs",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/trfs-starts-jobs"),
            title: "TRF - Inward/ Start a Job",
            transKey: "nav.dashboards.trfs-starts-jobs",
          },
          {
            id: "dashboards.lrn-cancel-requests-testing",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/lrn-cancel-requests"),
            title: "Lrn Cancel Requests",
            transKey: "nav.dashboards.lrn-cancel-requests-testing",
          },
          {
            id: "dashboards.revision-requests-testing",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/revision-requests"),
            title: "Revision Requests",
            transKey: "nav.dashboards.revision-requests-testing",
          },
          {
            id: "dashboards.dispatch-list-testing",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/testing/dispatch-list"),
            title: "Dispatch List",
            transKey: "nav.dashboards.dispatch-list-testing",
          },
        ],
      },
      {
        id: "dashboards.action-items",
        path: path(ROOT_DASHBOARDS, "/action-items"),
        type: NAV_TYPE_COLLAPSE,
        title: "Action Items",
        transKey: "nav.dashboards.action-items",
        Icon: Statistic2Icon, // Replace with your actual icon
        childs: [
          {
            id: "dashboards.pending-technical-acceptance",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/action-items/pending-technical-acceptance",
            ),
            title: "Pending Technical Acceptance",
            transKey: "nav.dashboards.pending-technical-acceptance",
          },
          {
            id: "dashboards.allot-sample",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/allot-sample"),
            title: "Allot Sample",
            transKey: "nav.dashboards.allot-sample",
          },
          {
            id: "dashboards.accept-sample",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/accept-sample"),
            title: "Accept Sample",
            transKey: "nav.dashboards.accept-sample",
          },
          {
            id: "dashboards.assign-chemist",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/assign-chemist"),
            title: "Assign Chemist",
            transKey: "nav.dashboards.assign-chemist",
          },
          {
            id: "dashboards.perform-testing",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/perform-testing"),
            title: "Perform Testing",
            transKey: "nav.dashboards.perform-testing",
          },
          {
            id: "dashboards.view-draft-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/view-draft-report"),
            title: "View Draft Report",
            transKey: "nav.dashboards.view-draft-report",
          },
          {
            id: "dashboards.review-by-hod",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/review-by-hod"),
            title: "Review By HOD",
            transKey: "nav.dashboards.review-by-hod",
          },
          {
            id: "dashboards.review-by-qa",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/review-by-qa"),
            title: "Review By QA",
            transKey: "nav.dashboards.review-by-qa",
          },
          {
            id: "dashboards.generate-ulr",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/generate-ulr"),
            title: "Generate ULR",
            transKey: "nav.dashboards.generate-ulr",
          },
          {
            id: "dashboards.pending-upload-reports",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/pending-upload-reports"),
            title: "Pending Upload Reports",
            transKey: "nav.dashboards.pending-upload-reports",
          },
          {
            id: "dashboards.final-reports-unsigned",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/final-reports-unsigned"),
            title: "Final Reports Unsigned",
            transKey: "nav.dashboards.final-reports-unsigned",
          },
          {
            id: "dashboards.signed-reports",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/action-items/signed-reports"),
            title: "Signed Reports",
            transKey: "nav.dashboards.signed-reports",
          },
        ],
      },
      {
        id: "dashboards.approvals",
        path: path(ROOT_DASHBOARDS, "/approvals"),
        type: NAV_TYPE_COLLAPSE,
        title: "Approvals",
        transKey: "nav.dashboards.approvals",
        Icon: MegaphoneIcon,
        childs: [
          {
            id: "dashboards.priority-approval",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/approvals/priority-approval"),
            title: "Priority Approval",
            transKey: "nav.dashboards.priority-approval",
          },
          {
            id: "dashboards.payment-approval-testing",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/approvals/payment-approval-testing"),
            title: "Payment Approval Testing",
            transKey: "nav.dashboards.payment-approval-testing",
          },
          {
            id: "dashboards.payment-approval-calibration",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/approvals/payment-approval-calibration",
            ),
            title: "Payment Approval Calibration",
            transKey: "nav.dashboards.payment-approval-calibration",
          },
          {
            id: "dashboards.payment-hold-notification-1",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/approvals/payment-hold-notification-1",
            ),
            title: "Payment Hold Notification",
            transKey: "nav.dashboards.payment-hold-notification-1",
          },
          {
            id: "dashboards.payment-approval-2",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/approvals/payment-approval-2"),
            title: "Payment Approval 2",
            transKey: "nav.dashboards.payment-approval-2",
          },
          {
            id: "dashboards.witness-approval",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/approvals/witness-approval"),
            title: "Witness Approval",
            transKey: "nav.dashboards.witness-approval",
          },
          {
            id: "dashboards.witness-lock",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/approvals/witness-lock"),
            title: "Witness Lock",
            transKey: "nav.dashboards.witness-lock",
          },
          {
            id: "dashboards.payment-hold-notification-2",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/approvals/payment-hold-notification-2",
            ),
            title: "Payment Hold Notification",
            transKey: "nav.dashboards.payment-hold-notification-2",
          },
          {
            id: "dashboards.calibration-payment-approval-2",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/approvals/calibration-payment-approval-2",
            ),
            title: "Calibration Payment Approval 2",
            transKey: "nav.dashboards.calibration-payment-approval-2",
          },
          {
            id: "dashboards.approve-signature",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/approvals/approve-signature"),
            title: "Approve Signature",
            transKey: "nav.dashboards.approve-signature",
          },
        ],
      },
      {
        id: "dashboards.sales",
        path: path(ROOT_DASHBOARDS, "/sales"),
        type: NAV_TYPE_COLLAPSE,
        title: "Sales",
        transKey: "nav.dashboards.sales",
        Icon: StudentIcon,
        childs: [
          {
            id: "dashboards.website-enquiry",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/sales/website-enquiry"),
            title: "Website Enquiry",
            transKey: "nav.dashboards.website-enquiry",
          },
          {
            id: "dashboards.enquiry",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/sales/enquiry"),
            title: "Enquiry",
            transKey: "nav.dashboards.enquiry",
          },
          {
            id: "dashboards.test-packages",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/sales/test-packages"),
            title: "Test Packages",
            transKey: "nav.dashboards.test-packages",
          },
          {
            id: "dashboards.calibration-quotations",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/sales/calibration-quotations"),
            title: "Calibration Quotations",
            transKey: "Calibration Quotations",
          },
          {
            id: "dashboards.testing-quotations",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/sales/testing-quotations"),
            title: "Testing Quotations",
            transKey: "nav.dashboards.testing-quotations",
          },
          {
            id: "dashboards.specific-price-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/sales/specific-price-list"),
            title: "Specific Price List",
            transKey: "nav.dashboards.specific-price-list",
          },
        ],
      },
      {
        id: "dashboards.role-management",
        path: path(ROOT_DASHBOARDS, "/role-management"),
        type: NAV_TYPE_COLLAPSE,
        title: "Role Management",
        transKey: "nav.dashboards.role-management",
        Icon: BtcIcon, // Replace with your actual icon
        childs: [
          {
            id: "dashboards.modules",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/role-management/modules"),
            title: "Modules",
            transKey: "nav.dashboards.modules",
          },
          {
            id: "dashboards.roles",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/role-management/roles"),
            title: "Roles",
            transKey: "nav.dashboards.roles",
          },
          {
            id: "dashboards.permissions",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/role-management/permissions"),
            title: "Permissions",
            transKey: "nav.dashboards.permissions",
          },
          {
            id: "dashboards.process-guide",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/role-management/process-guide"),
            title: "Process Guide",
            transKey: "nav.dashboards.process-guide",
          },
          {
            id: "dashboards.organisation-setting",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/role-management/organisation-setting",
            ),
            title: "Organisation Setting",
            transKey: "nav.dashboards.organisation-setting",
          },
        ],
      },
      {
        id: "dashboards.records",
        path: path(ROOT_DASHBOARDS, "/records"),
        type: NAV_TYPE_COLLAPSE,
        title: "Records",
        transKey: "nav.dashboards.records",
        Icon: StethoscopeIcon, // Replace with your actual icon
        childs: [
          {
            id: "dashboards.calibration-crf-srf",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/calibration-crf-srf"),
            title: "Calibration CRF SRF",
            transKey: "nav.dashboards.calibration-crf-srf",
          },
          {
            id: "dashboards.calibration-crf-srf-non-nabl",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/records/calibration-crf-srf-non-nabl",
            ),
            title: "Calibration CRF SRF Non Nabl",
            transKey: "nav.dashboards.calibration-crf-srf-non-nabl",
          },
          {
            id: "dashboards.sample-inward-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/sample-inward-register"),
            title: "Sample Inward Register",
            transKey: "nav.dashboards.sample-inward-register",
          },
          {
            id: "dashboards.records.lrn-brn-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/lrn-brn-register"),
            title: "LRN BRN Register",
            transKey: "nav.dashboards.lrn-brn-register",
          },
          {
            id: "dashboards.environmental-record",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/environmental-record"),
            title: "Environmental Record",
            transKey: "nav.dashboards.environmental-record",
          },
          {
            id: "dashboards.equipment-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/equipment-list"),
            title: "Equipment List",
            transKey: "nav.dashboards.equipment-list",
          },
          {
            id: "dashboards.calibration-schedule-period",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/calibration-schedule-period"),
            title: "Calibration Schedule Period",
            transKey: "nav.dashboards.calibration-schedule-period",
          },
          {
            id: "dashboards.dispatch-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/dispatch-register"),
            title: "Dispatch Register",
            transKey: "nav.dashboards.dispatch-register",
          },
          {
            id: "dashboards.service-report-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/service-report-list"),
            title: "Service Report List",
            transKey: "nav.dashboards.service-report-list",
          },
          {
            id: "dashboards.records.ulr-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/ulr-list"),
            title: "ULR List",
            transKey: "nav.dashboards.ulr-list",
          },
          {
            id: "dashboards.cmc-scope-sheet",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/records/cmc-scope-sheet"),
            title: "CMC Scope Sheet",
            transKey: "nav.dashboards.cmc-scope-sheet",
          },
        ],
      },
      {
        id: "dashboards.registers",
        path: path(ROOT_DASHBOARDS, "/registers"),
        type: NAV_TYPE_COLLAPSE,
        title: "Registers",
        transKey: "nav.dashboards.registers",
        Icon: PeopleIcon, // Replace with appropriate icon
        childs: [
          {
            id: "dashboards.assigned-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/assigned-register"),
            title: "Assigned Register",
            transKey: "nav.dashboards.assigned-register",
          },
          {
            id: "dashboards.assigned-calibration-register",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/registers/assigned-calibration-register",
            ),
            title: "Assigned Calibration Register",
            transKey: "nav.dashboards.assigned-calibration-register",
          },
          {
            id: "dashboards.testing-track-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/testing-track-report"),
            title: "Testing Track Report",
            transKey: "nav.dashboards.testing-track-report",
          },
          {
            id: "dashboards.calibration-track-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/calibration-track-report"),
            title: "Calibration Track Report",
            transKey: "nav.dashboards.calibration-track-report",
          },
          {
            id: "dashboards.pending-for-testing-lrn-wise",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/registers/pending-for-testing-lrn-wise",
            ),
            title: "Pending For Testing Lrn Wise List",
            transKey: "nav.dashboards.pending-for-testing-lrn-wise",
          },
          {
            id: "dashboards.pending-for-testing-parameter-wise",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/registers/pending-for-testing-parameter-wise",
            ),
            title: "Pending For Testing Parameter Wise List",
            transKey: "nav.dashboards.pending-for-testing-parameter-wise",
          },
          {
            id: "dashboards.parameter-wise-status-list",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/registers/parameter-wise-status-list",
            ),
            title: "Parameter Wise Status List",
            transKey: "nav.dashboards.parameter-wise-status-list",
          },
          {
            id: "dashboards.ulr-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/ulr-register"),
            title: "ULR Register",
            transKey: "nav.dashboards.ulr-register",
          },
          {
            id: "dashboards.alloted-items",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/alloted-items"),
            title: "Alloted Items",
            transKey: "nav.dashboards.alloted-items",
          },
          {
            id: "dashboards.sample-inward-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/sample-inward-register"),
            title: "Sample Inward Register",
            transKey: "nav.dashboards.sample-inward-register",
          },
          {
            id: "dashboards.bis-sample-inward-register",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/registers/bis-sample-inward-register",
            ),
            title: "BIS Sample Inward Register",
            transKey: "nav.dashboards.bis-sample-inward-register",
          },
          {
            id: "dashboards.received-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/received-register"),
            title: "Received Register",
            transKey: "nav.dashboards.received-register",
          },
          {
            id: "dashboards.remnant-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/remnant-register"),
            title: "Remnant Register",
            transKey: "nav.dashboards.remnant-register",
          },
          {
            id: "dashboards.dispatch-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/dispatch-register"),
            title: "Dispatch Register",
            transKey: "nav.dashboards.dispatch-register",
          },
          {
            id: "dashboards.disposal-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/disposal-register"),
            title: "Disposal Register",
            transKey: "nav.dashboards.disposal-register",
          },
          {
            id: "dashboards.bis-disposal-register",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/bis-disposal-register"),
            title: "BIS Disposal Register",
            transKey: "nav.dashboards.bis-disposal-register",
          },
          {
            id: "dashboards.calibration-schedule-period",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/registers/calibration-schedule-period",
            ),
            title: "Calibration Schedule Period",
            transKey: "nav.dashboards.calibration-schedule-period",
          },
          {
            id: "dashboards.equipment-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/equipment-list"),
            title: "Equipment List",
            transKey: "nav.dashboards.equipment-list",
          },
          {
            id: "dashboards.crm-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/crm-list"),
            title: "CRM List",
            transKey: "nav.dashboards.crm-list",
          },
          {
            id: "dashboards.pending-samples",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/pending-samples"),
            title: "Pending Samples",
            transKey: "nav.dashboards.pending-samples",
          },
          {
            id: "dashboards.environmental-condition",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/registers/environmental-condition"),
            title: "Environmental Condition",
            transKey: "nav.dashboards.environmental-condition",
          },
        ],
      },
      {
        id: "dashboards.inventory",
        path: path(ROOT_DASHBOARDS, "/inventory"),
        type: NAV_TYPE_COLLAPSE,
        title: "Inventory",
        transKey: "nav.dashboards.inventory",
        Icon: PeopleEditIcon, // Replace with actual inventory-related icon
        childs: [
          {
            id: "dashboards.categories",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/categories"),
            title: "Categories",
            transKey: "nav.dashboards.categories",
          },
          {
            id: "dashboards.subcategories",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/subcategories"),
            title: "Product Type/ Subcategory",
            transKey: "nav.dashboards.subcategories",
          },
          {
            id: "dashboards.product-type-stock",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/product-type-stock"),
            title: "Product Type Stock",
            transKey: "nav.dashboards.product-type-stock",
          },
          {
            id: "dashboards.purchase-requisition",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/purchase-requisition"),
            title: "Purchase Requisition",
            transKey: "nav.dashboards.purchase-requisition",
          },
          {
            id: "dashboards.purchase-order",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/purchase-order"),
            title: "Purchase Order",
            transKey: "nav.dashboards.purchase-order",
          },
          {
            id: "dashboards.mrn",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/mrn"),
            title: "MRN",
            transKey: "nav.dashboards.mrn",
          },
          {
            id: "dashboards.pending-for-coding",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/pending-for-coding"),
            title: "Pending For Coding",
            transKey: "nav.dashboards.pending-for-coding",
          },
          {
            id: "dashboards.pending-location",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/pending-location"),
            title: "Pending Location",
            transKey: "nav.dashboards.pending-location",
          },
          {
            id: "dashboards.pending-verification",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/pending-verification"),
            title: "Pending Verification",
            transKey: "nav.dashboards.pending-verification",
          },
          {
            id: "dashboards.stock",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/stock"),
            title: "Stock",
            transKey: "nav.dashboards.stock",
          },
          {
            id: "dashboards.din-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/din-list"),
            title: "Din List",
            transKey: "nav.dashboards.din-list",
          },
          {
            id: "dashboards.dispatch-return",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/dispatch-return"),
            title: "Dispatch Return",
            transKey: "nav.dashboards.dispatch-return",
          },
          {
            id: "dashboards.instrument-transfer",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/instrument-transfer"),
            title: "Instrument Transfer",
            transKey: "nav.dashboards.instrument-transfer",
          },
          {
            id: "dashboards.create-solutions",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/create-solutions"),
            title: "Create Solutions",
            transKey: "nav.dashboards.create-solutions",
          },
          {
            id: "dashboards.buffer-item",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/buffer-item"),
            title: "Buffer Item",
            transKey: "nav.dashboards.buffer-item",
          },
          {
            id: "dashboards.dump-instrument",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/dump-instrument"),
            title: "Dump Instrument",
            transKey: "nav.dashboards.dump-instrument",
          },
          {
            id: "dashboards.issue-return",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/inventory/issue-return"),
            title: "Issue Return",
            transKey: "nav.dashboards.issue-return",
          },
        ],
      },
      {
        id: "dashboards.people",
        path: path(ROOT_DASHBOARDS, "/people"),
        type: NAV_TYPE_COLLAPSE,
        title: "People",
        transKey: "nav.dashboards.people",
        Icon: PeopleMonitorIcon, // Replace with a people/user-related icon
        childs: [
          {
            id: "dashboards.customer-categories",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/customer-categories"),
            title: "Customer Categories",
            transKey: "nav.dashboards.customer-categories",
          },
          {
            id: "dashboards.customer-types",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/customer-types"),
            title: "Customer Types",
            transKey: "nav.dashboards.customer-types",
          },
          {
            id: "dashboards.specific-purposes",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/specific-purposes"),
            title: "Specific Purposes",
            transKey: "nav.dashboards.specific-purposes",
          },
          {
            id: "dashboards.customers",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/customers"),
            title: "Customers",
            transKey: "nav.dashboards.customers",
          },
          {
            id: "dashboards.promoters",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/promoters"),
            title: "Promoters",
            transKey: "nav.dashboards.promoters",
          },
          {
            id: "dashboards.suppliers",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/suppliers"),
            title: "Suppliers",
            transKey: "nav.dashboards.suppliers",
          },
          {
            id: "dashboards.users",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/people/users"),
            title: "Users",
            transKey: "nav.dashboards.users",
          },
        ],
      },
      {
        id: "dashboards.profile",
        path: path(ROOT_DASHBOARDS, "/profile"),
        type: NAV_TYPE_COLLAPSE,
        title: "Profile",
        transKey: "nav.dashboards.profile",
        Icon: TeacherIcon, // You can replace with a profile/user icon
        childs: [
          {
            id: "dashboards.din-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/din-list"),
            title: "Din List",
            transKey: "nav.dashboards.din-list",
          },
          {
            id: "dashboards.attendance",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/attendance"),
            title: "Attendance",
            transKey: "nav.dashboards.attendance",
          },
          {
            id: "dashboards.my-leaves",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/my-leaves"),
            title: "My Leaves",
            transKey: "nav.dashboards.my-leaves",
          },
          {
            id: "dashboards.leaves-approval",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/leaves-approval"),
            title: "Leaves Approval",
            transKey: "nav.dashboards.leaves-approval",
          },
          {
            id: "dashboards.my-issue-item-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/my-issue-item-list"),
            title: "My Issue Item List",
            transKey: "nav.dashboards.my-issue-item-list",
          },
          {
            id: "dashboards.request-new-customer",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/request-new-customer"),
            title: "Request New Customer",
            transKey: "nav.dashboards.request-new-customer",
          },
          {
            id: "dashboards.raise-complaint",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/raise-complaint"),
            title: "Raise A Complaint",
            transKey: "nav.dashboards.raise-complaint",
          },
          {
            id: "dashboards.complaint-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/complaint-list"),
            title: "Complaint List",
            transKey: "nav.dashboards.complaint-list",
          },
          {
            id: "dashboards.my-department-stock",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/my-department-stock"),
            title: "My Departments Stock",
            transKey: "nav.dashboards.my-department-stock",
          },
          {
            id: "dashboards.my-sales-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/my-sales-report"),
            title: "My Sales Report",
            transKey: "nav.dashboards.my-sales-report",
          },
          {
            id: "dashboards.invoice-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/invoice-report"),
            title: "Invoice Report",
            transKey: "nav.dashboards.invoice-report",
          },
          {
            id: "dashboards.payment-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/payment-report"),
            title: "Payment Report",
            transKey: "nav.dashboards.payment-report",
          },
          {
            id: "dashboards.mom-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/mom-list"),
            title: "MOM List",
            transKey: "nav.dashboards.mom-list",
          },
          {
            id: "dashboards.my-kra",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/my-kra"),
            title: "My Kra",
            transKey: "nav.dashboards.my-kra",
          },
          {
            id: "dashboards.customer-complaint-record",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/customer-complaint-record"),
            title: "Customer Complaint Record",
            transKey: "nav.dashboards.customer-complaint-record",
          },
          {
            id: "dashboards.non-confirming-record",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/non-confirming-record"),
            title: "Non Confirming Record",
            transKey: "nav.dashboards.non-confirming-record",
          },
          {
            id: "dashboards.raise-incidence-deviation",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/raise-incidence-deviation"),
            title: "Raise Incidence/Deviation",
            transKey: "nav.dashboards.raise-incidence-deviation",
          },
          {
            id: "dashboards.incidence-deviation-record",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/profile/incidence-deviation-record"),
            title: "Incidence/Deviation Record",
            transKey: "nav.dashboards.incidence-deviation-record",
          },
        ],
      },
      {
        id: "dashboards.accounts",
        path: path(ROOT_DASHBOARDS, "/accounts"),
        type: NAV_TYPE_COLLAPSE,
        title: "Accounts",
        transKey: "nav.dashboards.accounts",
        Icon: MonitorIcon, // Replace with a suitable icon if needed
        childs: [
          {
            id: "dashboards.payment-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/payment-list"),
            title: "Payment List",
            transKey: "nav.dashboards.payment-list",
          },
          {
            id: "dashboards.payment-list-party-wise",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/payment-list-party-wise"),
            title: "Payment List Party wise",
            transKey: "nav.dashboards.payment-list-party-wise",
          },
          {
            id: "dashboards.testing-unbilled-items",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/testing-unbilled-items"),
            title: "Testing Unbilled Items",
            transKey: "nav.dashboards.testing-unbilled-items",
          },
          {
            id: "dashboards.calibration-unbilled-items",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/calibration-unbilled-items"),
            title: "Calibration Unbilled Items",
            transKey: "nav.dashboards.calibration-unbilled-items",
          },
          {
            id: "dashboards.proforma-invoice",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/proforma-invoice"),
            title: "Proforma Invoice",
            transKey: "nav.dashboards.proforma-invoice",
          },
          {
            id: "dashboards.calibration-invoice-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/calibration-invoice-list"),
            title: "Calibration Invoice List",
            transKey: "nav.dashboards.calibration-invoice-list",
          },
          {
            id: "dashboards.testing-invoices",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/testing-invoices"),
            title: "Testing Invoices",
            transKey: "nav.dashboards.testing-invoices",
          },
          {
            id: "dashboards.past-invoices",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/past-invoices"),
            title: "Past Invoices",
            transKey: "nav.dashboards.past-invoices",
          },
          {
            id: "dashboards.canceled-invoices",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/canceled-invoices"),
            title: "Canceled Invoices",
            transKey: "nav.dashboards.canceled-invoices",
          },
          {
            id: "dashboards.invoice-cancelation-request",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/accounts/invoice-cancelation-request",
            ),
            title: "Invoice Cancelation Request",
            transKey: "nav.dashboards.invoice-cancelation-request",
          },
          {
            id: "dashboards.credit-note",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/credit-note"),
            title: "Credit Note",
            transKey: "nav.dashboards.credit-note",
          },
          {
            id: "dashboards.invoice-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/invoice-report"),
            title: "Invoice Report",
            transKey: "nav.dashboards.invoice-report",
          },
          {
            id: "dashboards.complete-ledger",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/complete-ledger"),
            title: "Complete Ledger",
            transKey: "nav.dashboards.complete-ledger",
          },
          {
            id: "dashboards.sales-report",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/sales-report"),
            title: "Sales Report",
            transKey: "nav.dashboards.sales-report",
          },
          {
            id: "dashboards.gstr-1",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/gstr-1"),
            title: "GSTR-1",
            transKey: "nav.dashboards.gstr-1",
          },
          {
            id: "dashboards.consent-letter",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/consent-letter"),
            title: "Consent Letter",
            transKey: "nav.dashboards.consent-letter",
          },
          {
            id: "dashboards.expense-category",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/expense-category"),
            title: "Expense Category",
            transKey: "nav.dashboards.expense-category",
          },
          {
            id: "dashboards.expenses",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/accounts/expenses"),
            title: "Expenses",
            transKey: "nav.dashboards.expenses",
          },
        ],
      },
      {
        id: "dashboards.hrm",
        path: path(ROOT_DASHBOARDS, "/hrm"),
        type: NAV_TYPE_COLLAPSE,
        title: "HRM",
        transKey: "nav.dashboards.hrm",
        Icon: ProjectBoardIcon, // Replace with appropriate HR icon
        childs: [
          {
            id: "dashboards.manage-branch",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/manage-branch"),
            title: "Manage Branch",
            transKey: "nav.dashboards.manage-branch",
          },
          {
            id: "dashboards.manage-departments",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/manage-departments"),
            title: "Manage Departments",
            transKey: "nav.dashboards.manage-departments",
          },
          {
            id: "dashboards.manage-designations",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/manage-designations"),
            title: "Manage Designations",
            transKey: "nav.dashboards.manage-designations",
          },
          {
            id: "dashboards.manage-policies",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/manage-policies"),
            title: "Manage Policies",
            transKey: "nav.dashboards.manage-policies",
          },
          {
            id: "dashboards.salary-structure-design",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/salary-structure-design"),
            title: "Salary Structure Design",
            transKey: "nav.dashboards.salary-structure-design",
          },
          {
            id: "dashboards.professional-tax",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/professional-tax"),
            title: "Professional Tax",
            transKey: "nav.dashboards.professional-tax",
          },
          {
            id: "dashboards.view-all-attendance",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/view-all-attendance"),
            title: "View All Attendance",
            transKey: "nav.dashboards.view-all-attendance",
          },
          {
            id: "dashboards.view-all-leaves",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/view-all-leaves"),
            title: "View All Leaves",
            transKey: "nav.dashboards.view-all-leaves",
          },
          {
            id: "dashboards.manage-leave-rules",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/manage-leave-rules"),
            title: "Manage Leave Rules",
            transKey: "nav.dashboards.manage-leave-rules",
          },
          {
            id: "dashboards.view-attendance-policies",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/view-attendance-policies"),
            title: "View Attendance Policies",
            transKey: "nav.dashboards.view-attendance-policies",
          },
          {
            id: "dashboards.add-attendance-policy",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/add-attendance-policy"),
            title: "Add Attendance Policy",
            transKey: "nav.dashboards.add-attendance-policy",
          },
          {
            id: "dashboards.holidays",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/holidays"),
            title: "Holidays",
            transKey: "nav.dashboards.holidays",
          },
          {
            id: "dashboards.view-offer-letters-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/view-offer-letters-list"),
            title: "View Offer Letters List",
            transKey: "nav.dashboards.view-offer-letters-list",
          },
          {
            id: "dashboards.manage-employee",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/manage-employee"),
            title: "Manage Employee",
            transKey: "nav.dashboards.manage-employee",
          },
          {
            id: "dashboards.approve-employee",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/approve-employee"),
            title: "Approve Employee",
            transKey: "nav.dashboards.approve-employee",
          },
          {
            id: "dashboards.employee-termination",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/employee-termination"),
            title: "Employee Termination",
            transKey: "nav.dashboards.employee-termination",
          },
          {
            id: "dashboards.pending-appraisal-list",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/hrm/pending-appraisal-list"),
            title: "Pending Appraisal List",
            transKey: "nav.dashboards.pending-appraisal-list",
          },
        ],
      },
      {
        id: "dashboards.training",
        path: path(ROOT_DASHBOARDS, "/training"),
        type: NAV_TYPE_COLLAPSE,
        title: "Training",
        transKey: "nav.dashboards.training",
        Icon: WidgetIcon, // Replace with appropriate icon if needed
        childs: [
          {
            id: "dashboards.employees-in-induction",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/employees-in-induction"),
            title: "Employees In Induction",
            transKey: "nav.dashboards.employees-in-induction",
          },
          {
            id: "dashboards.employee-pending-for-training",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/training/employee-pending-for-training",
            ),
            title: "Employee Pending For Training",
            transKey: "nav.dashboards.employee-pending-for-training",
          },
          {
            id: "dashboards.employee-in-training",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/employee-in-training"),
            title: "Employee In Training",
            transKey: "nav.dashboards.employee-in-training",
          },
          {
            id: "dashboards.training-schedule",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/training-schedule"),
            title: "Training Schedule",
            transKey: "nav.dashboards.training-schedule",
          },
          {
            id: "dashboards.retraining-old-employee",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/retraining-old-employee"),
            title: "Retraining of Old Employee",
            transKey: "nav.dashboards.retraining-old-employee",
          },
          {
            id: "dashboards.employees-in-training",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/employees-in-training"),
            title: "Employees in Training",
            transKey: "nav.dashboards.employees-in-training",
          },
          {
            id: "dashboards.clear-training-status-new",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/clear-training-status-new"),
            title: "Clear Training Status New",
            transKey: "nav.dashboards.clear-training-status-new",
          },
          {
            id: "dashboards.training-results",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/training/training-results"),
            title: "Training Results",
            transKey: "nav.dashboards.training-results",
          },
        ],
      },
      {
        id: "dashboards.gate-entry",
        path: path(ROOT_DASHBOARDS, "/gate-entry"),
        type: NAV_TYPE_COLLAPSE,
        title: "Gate Entry",
        transKey: "nav.dashboards.gate-entry",
        Icon: HooksIcon, // Replace with appropriate icon
        childs: [
          {
            id: "dashboards.gate-entry-entry",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/gate-entry"),
            title: "Gate Entry",
            transKey: "nav.dashboards.gate-entry-entry",
          },
          {
            id: "dashboards.issued-entry",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/gate-entry/issued-entry"),
            title: "Issued Entry",
            transKey: "nav.dashboards.issued-entry",
          },
          {
            id: "dashboards.issued-to-me",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/gate-entry/issued-to-me"),
            title: "Issued To Me",
            transKey: "nav.dashboards.issued-to-me",
          },
        ],
      },
      {
        id: "dashboards.quality-documents",
        path: path(ROOT_DASHBOARDS, "/quality-documents"),
        type: NAV_TYPE_COLLAPSE,
        title: "Quality Documents",
        transKey: "nav.dashboards.quality-documents",
        Icon: UtilityIcon, // Replace with an appropriate icon
        childs: [
          {
            id: "dashboards.role-request",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/quality-documents/role-request"),
            title: "Role Request",
            transKey: "nav.dashboards.role-request",
          },
          {
            id: "dashboards.verification-lims",
            type: NAV_TYPE_ITEM,
            path: path(ROOT_DASHBOARDS, "/quality-documents/verification-lims"),
            title: "Verification - LIMS vs Existing Format",
            transKey: "nav.dashboards.verification-lims",
          },
          {
            id: "dashboards.quality-objectives",
            type: NAV_TYPE_ITEM,
            path: path(
              ROOT_DASHBOARDS,
              "/quality-documents/quality-objectives",
            ),
            title: "Quality Objectives",
            transKey: "nav.dashboards.quality-objectives",
          },
        ],
      },
    ],
  };

  return {
    ...dashboardsConfig,
    childs: filterDashboardItemsByPermissions(
      dashboardsConfig.childs,
      permissions,
    ),
  };
};
// Default export with empty array (will be replaced by dynamic data)
export const dashboards = generateDashboardsConfig([], []);

