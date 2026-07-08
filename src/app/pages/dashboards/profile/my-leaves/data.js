export const statusOptions = [
  { value: "", label: "All" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Approved" },
  { value: "2", label: "Rejected" },
];

export const leaveTypeOptions = [
  { value: "", label: "All" },
  { value: "CL", label: "Casual Leave (CL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "EL", label: "Earned Leave (EL)" },
  { value: "CO", label: "Comp Off" },
];

export const LEAVE_TYPE_MAP = {
  "1": "Casual Leave (CL)",
  "2": "Sick Leave (SL)",
  "3": "Earned Leave (EL)",
  "4": "Comp Off",
  "CL": "Casual Leave (CL)",
  "SL": "Sick Leave (SL)",
  "EL": "Earned Leave (EL)",
  "Compoff": "Comp Off",
  "compoff": "Comp Off",
};
