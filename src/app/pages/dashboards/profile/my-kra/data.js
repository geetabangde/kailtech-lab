export const statusOptions = [
  { value: "", label: "All Status" },
  { value: "0", label: "Not Accepted" },
  { value: "1", label: "Accepted" }
];

export const activeOptions = [
  { value: "", label: "All States" },
  { value: "0", label: "Not Accepted" },
  { value: "1", label: "Accepted" },
  { value: "2", label: "Self Assessed" },
  { value: "3", label: "Assessed 1" },
  { value: "4", label: "Assessed 2" },
  { value: "5", label: "In Active" }
];

export const statusMap = {
  "0": "Not Accepted",
  "1": "Accepted"
};

export const activeMap = {
  "0": "Not Accepted",
  "1": "Accepted",
  "2": "Self Assessed",
  "3": "Assessed 1",
  "4": "Assessed 2",
  "5": "In Active"
};

export const mockKras = [
  {
    id: 1,
    kra: "Maintain laboratory calibration equipment uptime above 98% with zero major safety incidents.",
    alloted_to_name: "Rahul Sharma",
    status: "1", // Accepted
    created_by_name: "Sanjay Gupta",
    remark: "Achieved 99.4% uptime in Q1; scheduled automated preventative maintenance cycles.",
    mark: 9.5,
    active_status: "4" // Assessed 2
  },
  {
    id: 2,
    kra: "Ensure NABL quality compliance audits yield zero non-compliance records (NCRs).",
    alloted_to_name: "Dr. Amit Verma",
    status: "1", // Accepted
    created_by_name: "Sanjay Gupta",
    remark: "Internal audits completed successfully; documentation is fully up to date.",
    mark: 8.8,
    active_status: "3" // Assessed 1
  },
  {
    id: 3,
    kra: "Onboard and check-off 5 junior laboratory technicians on high-voltage calibration procedures.",
    alloted_to_name: "Rahul Sharma",
    status: "1", // Accepted
    created_by_name: "Dr. Amit Verma",
    remark: "3 technicians fully checked-off; 2 in progress with expected completion next month.",
    mark: 7.5,
    active_status: "2" // Self Assessed
  },
  {
    id: 4,
    kra: "Reduce customer support invoice billing cycles from 72 hours to under 48 hours.",
    alloted_to_name: "Priya Patel",
    status: "0", // Not Accepted
    created_by_name: "Dr. Amit Verma",
    remark: "Currently review processes are locked by billing manager approval delays.",
    mark: 0,
    active_status: "0" // Not Accepted
  },
  {
    id: 5,
    kra: "Conduct safety training drill and electrical equipment insulation tests across Area C.",
    alloted_to_name: "John Doe",
    status: "0", // Not Accepted
    created_by_name: "Rahul Sharma",
    remark: "Insulation testing kit is offline; waiting for standard vendor re-calibration.",
    mark: 5.0,
    active_status: "5" // In Active
  }
];
