export const statusOptions = [
  { value: "", label: "All Status" },
  { value: "0", label: "Open" },
  { value: "1", label: "In Progress" },
  { value: "2", label: "Completed" },
  { value: "3", label: "Closed" },
  { value: "4", label: "Pending Approval" }
];

export const statusMap = {
  "0": "Open",
  "1": "In Progress",
  "2": "Completed",
  "3": "Closed",
  "4": "Pending Approval",
  "Open": "Open",
  "In Progress": "In Progress",
  "Completed": "Completed",
  "Closed": "Closed",
  "Pending Approval": "Pending Approval"
};

export const mockMoms = [
  {
    id: 1,
    mom_date: "2026-05-28",
    mom_no: "MOM/2026/042",
    location: "Conference Room A",
    purpose: "NABL Pre-Audit Preparation & Calibration Scope Review",
    created_by_name: "Dr. Amit Verma",
    status: "In Progress",
    completion_status: 66,
    tasks: [
      {
        taskid: "TASK-42-01",
        description: "Re-verify primary standards calibration certificates and update register.",
        assignee: "Rahul Sharma",
        target_date: "2026-06-03",
        status: "Closed",
        remark: "All certificates verified and scanned copy uploaded to digital vault."
      },
      {
        taskid: "TASK-42-02",
        description: "Draft calibration uncertainty budget sheets for high-voltage testing.",
        assignee: "Sanjay Gupta",
        target_date: "2026-06-05",
        status: "Closed",
        remark: "Budget sheet reviewed and approved by HOD."
      },
      {
        taskid: "TASK-42-03",
        description: "Organize cleanroom environment logs and complete daily temp-humidity indices.",
        assignee: "Priya Patel",
        target_date: "2026-06-02",
        status: "Open",
        remark: "Logging is in progress; sheets for week 4 are pending signoff."
      }
    ]
  },
  {
    id: 2,
    mom_date: "2026-05-20",
    mom_no: "MOM/2026/039",
    location: "Lab Meeting Hall B",
    purpose: "Monthly Laboratory Safety & Equipment Verification",
    created_by_name: "Rahul Sharma",
    status: "Completed",
    completion_status: 100,
    tasks: [
      {
        taskid: "TASK-39-01",
        description: "Perform electrical safety visual check on all biomedical test units.",
        assignee: "John Doe",
        target_date: "2026-05-25",
        status: "Closed",
        remark: "Visual checks completed. 2 minor cable wear issues identified and rectified."
      },
      {
        taskid: "TASK-39-02",
        description: "Inspect eyewash stations and replenish first aid inventory.",
        assignee: "Alice Smith",
        target_date: "2026-05-22",
        status: "Closed",
        remark: "Replenished first aid kit with latest antiseptic solution and bandages."
      }
    ]
  },
  {
    id: 3,
    mom_date: "2026-05-12",
    mom_no: "MOM/2026/035",
    location: "Director's Office",
    purpose: "Annual Budget Planning & New Calibration Instrument Purchase",
    created_by_name: "Sanjay Gupta",
    status: "Closed",
    completion_status: 100,
    tasks: [
      {
        taskid: "TASK-35-01",
        description: "Procure quotation for standard fluke multimeter and reference resistors.",
        assignee: "Priya Patel",
        target_date: "2026-05-18",
        status: "Closed",
        remark: "Received 3 competitive quotes; final recommendation submitted to Director."
      }
    ]
  },
  {
    id: 4,
    mom_date: "2026-05-02",
    mom_no: "MOM/2026/031",
    location: "IT Server Room",
    purpose: "LIMS Portal Version Upgrade & Cyber Security Audit",
    created_by_name: "IT Admin Team",
    status: "Open",
    completion_status: 33,
    tasks: [
      {
        taskid: "TASK-31-01",
        description: "Migrate legacy SQL server instance to containerized cloud databases.",
        assignee: "Sam Wilson",
        target_date: "2026-05-10",
        status: "Closed",
        remark: "Database successfully migrated and schema verified on production staging."
      },
      {
        taskid: "TASK-31-02",
        description: "Integrate multi-factor authentication (MFA) for executive staff profile portal.",
        assignee: "Clara Croft",
        target_date: "2026-06-15",
        status: "Open",
        remark: "Awaiting authentication SMS gateway vendor credentials validation."
      },
      {
        taskid: "TASK-31-03",
        description: "Conduct load and performance simulation on the report generation engine.",
        assignee: "Rahul Sharma",
        target_date: "2026-06-20",
        status: "Open",
        remark: "Simulation framework is ready, scheduled to execute over the weekend."
      }
    ]
  }
];
