export const statusOptions = [
  { value: "0", label: "Pending" },
  { value: "1", label: "Approved" },
  { value: "2", label: "Rejected" },
];

export const leaveTypeOptions = [
  { value: "CL", label: "Casual Leave (CL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "EL", label: "Earned Leave (EL)" },
  { value: "CO", label: "Comp Off (CO)" },
  { value: "HCL", label: "Half Casual Leave (HCL)" },
];

export const LEAVE_TYPE_MAP = {
  CL: "Casual Leave (CL)",
  SL: "Sick Leave (SL)",
  EL: "Earned Leave (EL)",
  CO: "Comp Off",
  HCL: "Half Casual Leave (HCL)",
  // legacy numeric keys
  "1": "Casual Leave (CL)",
  "2": "Sick Leave (SL)",
  "3": "Earned Leave (EL)",
  "4": "Comp Off",
  Compoff: "Comp Off",
  compoff: "Comp Off",
};
