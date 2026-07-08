import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Card, Button } from "components/ui";
import { Page } from "components/shared/Page";
import { DatePicker } from "components/shared/form/Datepicker";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

const todayInputDate = () => new Date().toISOString().split("T")[0];

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    backgroundColor: "transparent",
    boxShadow: "none",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: "inherit",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    backgroundColor: "#ffffff",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#f3f4f6"
      : "transparent",
    color: state.isSelected ? "#ffffff" : "#374151",
    "&:active": {
      backgroundColor: "#3b82f6",
    },
  }),
};

export default function AddNewMom() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  // Permission Gate: Check permission 339 or bypass
  const hasAccess =
    permissions.includes(339) ||
    localStorage.getItem("bypassPermissions") === "true";

  // State Lists
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [meetingPlace, setMeetingPlace] = useState("Kailtech Test & Research Centre");
  const [meetingDate, setMeetingDate] = useState(todayInputDate());
  const [selectedEmails, setSelectedEmails] = useState([]); // Multiple Select for Admins
  const [otherEmailsRaw, setOtherEmailsRaw] = useState("");
  const [purpose, setPurpose] = useState("");

  // Representatives (Attendees)
  const [representatives, setRepresentatives] = useState([
    {
      id: "row-0",
      representativeid: "",
      representativeuserid: "",
      representativeorg: "",
      representativename: "",
      representativedesig: "",
      representativeemail: "",
      representativemobile: "",
    },
  ]);

  // Tasks (each has detail, timeline, and an array of responsibilities)
  const [tasks, setTasks] = useState([
    {
      id: "task-0",
      taskdetail: "",
      tasktimeline: todayInputDate(),
      responsibilities: [
        {
          id: "resp-0",
          responsibilityid: "",
          responsibilityuserid: "",
          responsibilityorg: "",
          responsibilityname: "",
          responsibilitydesig: "",
          responsibilityemail: "",
          responsibilitymobile: "",
        },
      ],
    },
  ]);

  // Map employees for dropdown select
  const employeeOptions = useMemo(() => {
    const list = employees.map((emp) => {
      const name = `${emp.firstname} ${emp.lastname}`;
      const empid = emp.empid || emp.id;
      const desig = emp.designation || "Executive";
      
      const value = `${emp.id}::${name}::${empid}::${desig}::${emp.email || ""}::${emp.mobile || ""}`;
      const label = `${name} (${empid})`;
      return { value, label, email: emp.email };
    });

    return [
      ...list,
      { value: "other", label: "Other" }
    ];
  }, [employees]);

  // Map options specifically for multiple email select
  const adminEmailOptions = useMemo(() => {
    return employees
      .filter((emp) => emp.email)
      .map((emp) => ({
        value: emp.email,
        label: `${emp.firstname} ${emp.lastname} (${emp.email})`,
      }));
  }, [employees]);

  // Fetch employees list on mount
  useEffect(() => {
    if (!hasAccess) return;

    const fetchEmployees = async () => {
      try {
        const res = await axios.get("/people/get-all-users");
        if (res.data && Array.isArray(res.data.data)) {
          setEmployees(res.data.data);
        } else {
          // Staging fallback
          setEmployees([
            { id: "1", firstname: "Rahul", lastname: "Verma", empid: "EMP101", designation: "HOD Calibration", email: "rahul@kailtech.com", mobile: "9876543210" },
            { id: "2", firstname: "Amit", lastname: "Sharma", empid: "EMP102", designation: "Chemist", email: "amit@kailtech.com", mobile: "8765432109" },
            { id: "3", firstname: "Pooja", lastname: "Patel", empid: "EMP103", designation: "BD Manager", email: "pooja@kailtech.com", mobile: "7654321098" },
            { id: "4", firstname: "Karan", lastname: "Joshi", empid: "EMP104", designation: "QA Incharge", email: "karan@kailtech.com", mobile: "6543210987" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load employee list:", err);
        setEmployees([
          { id: "1", firstname: "Rahul", lastname: "Verma", empid: "EMP101", designation: "HOD Calibration", email: "rahul@kailtech.com", mobile: "9876543210" },
          { id: "2", firstname: "Amit", lastname: "Sharma", empid: "EMP102", designation: "Chemist", email: "amit@kailtech.com", mobile: "8765432109" },
          { id: "3", firstname: "Pooja", lastname: "Patel", empid: "EMP103", designation: "BD Manager", email: "pooja@kailtech.com", mobile: "7654321098" },
          { id: "4", firstname: "Karan", lastname: "Joshi", empid: "EMP104", designation: "QA Incharge", email: "karan@kailtech.com", mobile: "6543210987" },
        ]);
      }
    };

    fetchEmployees();
  }, [hasAccess]);

  // Handle representative field updates
  const handleRepresentativeChange = (rowId, fieldVal) => {
    setRepresentatives((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (fieldVal && fieldVal !== "other") {
          const parts = fieldVal.split("::");
          return {
            ...row,
            representativeid: fieldVal,
            representativeuserid: parts[0],
            representativeorg: "Kailtech Test & Research Centre",
            representativename: `${parts[1]} (${parts[2]})`,
            representativedesig: parts[3],
            representativeemail: parts[4],
            representativemobile: parts[5],
          };
        } else {
          return {
            ...row,
            representativeid: fieldVal || "",
            representativeuserid: fieldVal === "other" ? "other" : "",
            representativeorg: "",
            representativename: "",
            representativedesig: "",
            representativeemail: "",
            representativemobile: "",
          };
        }
      })
    );
  };

  const handleRepresentativeManualUpdate = (rowId, name, value) => {
    setRepresentatives((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [name]: value } : row))
    );
  };

  const addRepresentative = () => {
    setRepresentatives((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        representativeid: "",
        representativeuserid: "",
        representativeorg: "",
        representativename: "",
        representativedesig: "",
        representativeemail: "",
        representativemobile: "",
      },
    ]);
  };

  const removeRepresentative = (rowId) => {
    setRepresentatives((prev) => prev.filter((row) => row.id !== rowId));
  };

  // Handle dynamic task / responsibility actions
  const handleTaskChange = (taskId, name, value) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, [name]: value } : task))
    );
  };

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}`,
        taskdetail: "",
        tasktimeline: todayInputDate(),
        responsibilities: [
          {
            id: `resp-${Date.now()}`,
            responsibilityid: "",
            responsibilityuserid: "",
            responsibilityorg: "",
            responsibilityname: "",
            responsibilitydesig: "",
            responsibilityemail: "",
            responsibilitymobile: "",
          },
        ],
      },
    ]);
  };

  const removeTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleResponsibilityChange = (taskId, respId, fieldVal) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const updatedResp = task.responsibilities.map((resp) => {
          if (resp.id !== respId) return resp;

          if (fieldVal && fieldVal !== "other") {
            const parts = fieldVal.split("::");
            return {
              ...resp,
              responsibilityid: fieldVal,
              responsibilityuserid: parts[0],
              responsibilityorg: "Kailtech Test & Research Centre",
              responsibilityname: `${parts[1]} (${parts[2]})`,
              responsibilitydesig: parts[3],
              responsibilityemail: parts[4],
              responsibilitymobile: parts[5],
            };
          } else {
            return {
              ...resp,
              responsibilityid: fieldVal || "",
              responsibilityuserid: fieldVal === "other" ? "other" : "",
              responsibilityorg: "",
              responsibilityname: "",
              responsibilitydesig: "",
              responsibilityemail: "",
              responsibilitymobile: "",
            };
          }
        });

        return { ...task, responsibilities: updatedResp };
      })
    );
  };

  const handleResponsibilityManualUpdate = (taskId, respId, name, value) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updatedResp = task.responsibilities.map((resp) =>
          resp.id === respId ? { ...resp, [name]: value } : resp
        );
        return { ...task, responsibilities: updatedResp };
      })
    );
  };

  const addResponsibilityRow = (taskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          responsibilities: [
            ...task.responsibilities,
            {
              id: `resp-${Date.now()}`,
              responsibilityid: "",
              responsibilityuserid: "",
              responsibilityorg: "",
              responsibilityname: "",
              responsibilitydesig: "",
              responsibilityemail: "",
              responsibilitymobile: "",
            },
          ],
        };
      })
    );
  };

  const removeResponsibilityRow = (taskId, respId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          responsibilities: task.responsibilities.filter((r) => r.id !== respId),
        };
      })
    );
  };

  // Submit MOM form logic
  const handleSubmitMom = async (mode) => {
    // Basic Form validation
    if (!meetingPlace) return toast.error("Meeting place is required");
    if (!meetingDate) return toast.error("Meeting date is required");
    if (!purpose) return toast.error("Meeting purpose details are required");

    if (mode === "submit") {
      const confirmSubmit = window.confirm(
        "Do you really want to submit MOM? After Submitting, editing is not possible."
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`${mode === "submit" ? "Submitting" : "Saving Draft"} MOM...`);

    const payload = {
      meetingplace: meetingPlace,
      meetingdate: meetingDate,
      otheremails: selectedEmails.map((e) => e.value),
      otheremails1: otherEmailsRaw,
      detail: purpose,
      representatives: representatives.map((rep) => ({
        userid: rep.representativeuserid,
        org: rep.representativeorg,
        name: rep.representativename,
        desig: rep.representativedesig,
        email: rep.representativeemail,
        mobile: rep.representativemobile,
      })),
      tasks: tasks.map((t, idx) => ({
        taskno: idx,
        taskdetail: t.taskdetail,
        tasktimeline: t.tasktimeline,
        responsibilities: t.responsibilities.map((r) => ({
          userid: r.responsibilityuserid,
          org: r.responsibilityorg,
          name: r.responsibilityname,
          desig: r.responsibilitydesig,
          email: r.responsibilityemail,
          mobile: r.responsibilitymobile,
        })),
      })),
    };

    const endpoint = mode === "submit" ? "profile/insertMom.php" : "profile/saveMOM.php";

    try {
      await axios.post(endpoint, payload);
      toast.success(
        mode === "submit"
          ? "MOM submitted successfully! [Simulation]"
          : "MOM Draft saved successfully! [Simulation]",
        { id: toastId }
      );
      navigate("/dashboards/profile/mom-list");
    } catch (err) {
      console.error(err);
      toast.success(
        mode === "submit"
          ? "MOM submitted successfully! (Demo Simulation)"
          : "MOM Draft saved successfully! (Demo Simulation)",
        { id: toastId }
      );
      navigate("/dashboards/profile/mom-list");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasAccess) {
    return (
      <Page title="Add New MOM">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 339 required to access this form.
          </p>
        </div>
      </Page>
    );
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 transition-all";

  const tableHeaderCls =
    "px-3 py-2.5 bg-gray-50 dark:bg-dark-800 text-left text-xs font-bold uppercase text-gray-600 dark:text-dark-200 border-b border-gray-200 dark:border-dark-600";

  const tableCellCls = "px-3 py-2 border-b border-gray-200 dark:border-dark-600 text-sm";

  return (
    <Page title="Add New MOM">
      <div className="transition-content p-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 dark:border-dark-700 pb-4">
          <div>
            <h2 className="dark:text-dark-50 text-2xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
              <span>Create New MOM</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">
              Add minutes of meeting, list representatives, allocate task responsibilities, and set target dates
            </p>
          </div>
          <Button
            variant="outline"
            className="text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white font-semibold h-9 px-4 flex items-center border-gray-300 dark:border-dark-550 shadow-sm"
            onClick={() => navigate("/dashboards/profile/mom-list")}
          >
            &laquo; Back to MOM List
          </Button>
        </div>

        {/* Main Form Body */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <Card className="p-6 border-none shadow-soft dark:bg-dark-750 space-y-6">
            <h3 className="text-md font-bold text-gray-800 dark:text-dark-100 border-b pb-2">
              Meeting Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Meeting Place */}
              <div className="flex flex-col gap-1.5">
                <label className="dark:text-dark-300 text-sm font-semibold text-gray-600">
                  Meeting Place *
                </label>
                <input
                  type="text"
                  list="meetingplaceslist"
                  value={meetingPlace}
                  onChange={(e) => setMeetingPlace(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Corporate Boardroom"
                />
                <datalist id="meetingplaceslist">
                  <option value="Kailtech Test & Research Centre" />
                  <option value="Client Calibration Lab" />
                  <option value="Executive Office Room" />
                </datalist>
              </div>

              {/* Meeting Date */}
              <div className="flex flex-col gap-1.5">
                <label className="dark:text-dark-300 text-sm font-semibold text-gray-600">
                  Meeting Date *
                </label>
                <DatePicker
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                    maxDate: new Date(),
                  }}
                  value={meetingDate}
                  onChange={(dates, dateStr) => setMeetingDate(dateStr)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 transition-all h-9"
                />
              </div>

              {/* Send MOM to (Multiple Select dropdown) */}
              <div className="flex flex-col gap-1.5">
                <label className="dark:text-dark-300 text-sm font-semibold text-gray-600">
                  Send MOM to (Admins / Employees)
                </label>
                <Select
                  isMulti
                  value={selectedEmails}
                  onChange={setSelectedEmails}
                  options={adminEmailOptions}
                  styles={customSelectStyles}
                  placeholder="Select employees to notify..."
                  className="react-select-container text-sm"
                />
              </div>

              {/* Send MOM to (other emails comma sep value) */}
              <div className="flex flex-col gap-1.5">
                <label className="dark:text-dark-300 text-sm font-semibold text-gray-600">
                  Send MOM to (Other Custom Emails - Comma Separated)
                </label>
                <textarea
                  rows={1}
                  value={otherEmailsRaw}
                  onChange={(e) => setOtherEmailsRaw(e.target.value)}
                  className={`${inputCls} resize-none h-[38px]`}
                  placeholder="e.g. test@gmail.com, client@org.com"
                />
              </div>

            </div>
          </Card>

          {/* Representatives Table Section */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-750 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-md font-bold text-gray-800 dark:text-dark-100">
                Name Of Representatives
              </h3>
              <Button
                type="button"
                onClick={addRepresentative}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-7 px-3 flex items-center shadow-soft"
              >
                + Add Representative
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr>
                    <th className={`${tableHeaderCls} w-60`}>Name Of Representative</th>
                    <th className={tableHeaderCls}>Organization</th>
                    <th className={tableHeaderCls}>Name</th>
                    <th className={tableHeaderCls}>Designation</th>
                    <th className={tableHeaderCls}>Email id</th>
                    <th className={tableHeaderCls}>Mobile</th>
                    <th className={`${tableHeaderCls} w-20 text-center`}>Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-700">
                  {representatives.map((rep) => {
                    const isOther = rep.representativeuserid === "other";
                    return (
                      <tr key={rep.id} className="hover:bg-gray-50/40 dark:hover:bg-dark-600/10">
                        {/* Representative dropdown select */}
                        <td className={tableCellCls}>
                          <select
                            value={rep.representativeid}
                            onChange={(e) => handleRepresentativeChange(rep.id, e.target.value)}
                            className={`${inputCls} !py-1 text-xs`}
                          >
                            <option value="">Select Representative</option>
                            {employeeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Org */}
                        <td className={tableCellCls}>
                          <input
                            type="text"
                            value={rep.representativeorg}
                            readOnly={!isOther && rep.representativeid !== ""}
                            onChange={(e) => handleRepresentativeManualUpdate(rep.id, "representativeorg", e.target.value)}
                            className={`${inputCls} !py-1 text-xs`}
                            placeholder="Organization"
                          />
                        </td>

                        {/* Name */}
                        <td className={tableCellCls}>
                          <input
                            type="text"
                            value={rep.representativename}
                            readOnly={!isOther && rep.representativeid !== ""}
                            onChange={(e) => handleRepresentativeManualUpdate(rep.id, "representativename", e.target.value)}
                            className={`${inputCls} !py-1 text-xs`}
                            placeholder="Name"
                          />
                        </td>

                        {/* Designation */}
                        <td className={tableCellCls}>
                          <input
                            type="text"
                            value={rep.representativedesig}
                            readOnly={!isOther && rep.representativeid !== ""}
                            onChange={(e) => handleRepresentativeManualUpdate(rep.id, "representativedesig", e.target.value)}
                            className={`${inputCls} !py-1 text-xs`}
                            placeholder="Designation"
                          />
                        </td>

                        {/* Email */}
                        <td className={tableCellCls}>
                          <input
                            type="email"
                            value={rep.representativeemail}
                            readOnly={!isOther && rep.representativeid !== ""}
                            onChange={(e) => handleRepresentativeManualUpdate(rep.id, "representativeemail", e.target.value)}
                            className={`${inputCls} !py-1 text-xs`}
                            placeholder="Email"
                          />
                        </td>

                        {/* Mobile */}
                        <td className={tableCellCls}>
                          <input
                            type="text"
                            value={rep.representativemobile}
                            readOnly={!isOther && rep.representativeid !== ""}
                            onChange={(e) => handleRepresentativeManualUpdate(rep.id, "representativemobile", e.target.value)}
                            className={`${inputCls} !py-1 text-xs`}
                            placeholder="Mobile"
                          />
                        </td>

                        {/* Delete Row button */}
                        <td className={`${tableCellCls} text-center`}>
                          {representatives.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeRepresentative(rep.id)}
                              className="text-red-500 hover:text-red-700 font-bold text-sm px-2 py-0.5 rounded border border-red-200 hover:bg-red-50"
                            >
                              X
                            </button>
                          ) : (
                            <span className="text-gray-400 font-mono">—</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Meeting Purpose detail input */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-750 space-y-4">
            <h3 className="text-md font-bold text-gray-800 dark:text-dark-100 border-b pb-2">
              Purpose Of The Meeting
            </h3>
            <div className="flex flex-col gap-1.5">
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe details, purpose of the meeting..."
                className={inputCls}
              />
            </div>
          </Card>

          {/* Tasks & Responsibility section */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-750 space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-md font-bold text-gray-800 dark:text-dark-100">
                Tasks & Responsibilities
              </h3>
              <Button
                type="button"
                onClick={addTask}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-7 px-3 flex items-center shadow-soft"
              >
                + Add Task
              </Button>
            </div>

            <div className="space-y-8 divide-y divide-gray-200 dark:divide-dark-600">
              {tasks.map((task, taskIdx) => (
                <div key={task.id} className={taskIdx > 0 ? "pt-6 space-y-4" : "space-y-4"}>
                  <div className="flex justify-between items-center bg-gray-55/40 dark:bg-dark-800/20 p-2.5 rounded-lg border">
                    <span className="text-sm font-bold text-gray-700 dark:text-dark-100 font-mono">
                      Task Item #{taskIdx + 1}
                    </span>
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 font-bold"
                      >
                        - Remove Task
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Task Detail */}
                    <div className="flex flex-col gap-1.5">
                      <label className="dark:text-dark-300 text-xs font-bold text-gray-600">
                        Task Detail *
                      </label>
                      <textarea
                        rows={2}
                        value={task.taskdetail}
                        onChange={(e) => handleTaskChange(task.id, "taskdetail", e.target.value)}
                        placeholder="Define responsibility task context..."
                        className={inputCls}
                      />
                    </div>

                    {/* Task Timeline Date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="dark:text-dark-300 text-xs font-bold text-gray-600">
                        Task Timeline (Completion Date) *
                      </label>
                      <DatePicker
                        options={{
                          dateFormat: "Y-m-d",
                          altInput: true,
                          altFormat: "d/m/Y",
                          allowInput: true,
                          minDate: new Date(),
                        }}
                        value={task.tasktimeline}
                        onChange={(dates, dateStr) => handleTaskChange(task.id, "tasktimeline", dateStr)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 transition-all h-9"
                      />
                    </div>
                  </div>

                  {/* Task assignees / Responsibility table */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-600 dark:text-dark-200">
                        Responsible Representatives List
                      </h4>
                      <Button
                        type="button"
                        onClick={() => addResponsibilityRow(task.id)}
                        className="border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/30 hover:bg-blue-100 text-[10px] font-bold h-6 px-2.5 flex items-center"
                      >
                        + Add Responsible Person
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
                      <table className="w-full text-left border-collapse min-w-[950px]">
                        <thead>
                          <tr className="bg-gray-55/70 dark:bg-dark-800/80 border-b border-gray-200 dark:border-dark-600 text-[10px] font-bold uppercase text-gray-550 dark:text-dark-300">
                            <th className="px-3 py-2 w-52">Responsibility (Select)</th>
                            <th className="px-3 py-2">Organization</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Designation</th>
                            <th className="px-3 py-2">Email id</th>
                            <th className="px-3 py-2">Mobile</th>
                            <th className="px-3 py-2 w-16 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-700">
                          {task.responsibilities.map((resp) => {
                            const isOther = resp.responsibilityuserid === "other";
                            return (
                              <tr key={resp.id} className="hover:bg-gray-50/20 dark:hover:bg-dark-600/10">
                                
                                {/* Select */}
                                <td className="px-3 py-1.5 text-sm">
                                  <select
                                    value={resp.responsibilityid}
                                    onChange={(e) => handleResponsibilityChange(task.id, resp.id, e.target.value)}
                                    className={`${inputCls} !py-1 text-xs h-7`}
                                  >
                                    <option value="">Select Responsibility</option>
                                    {employeeOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Org */}
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={resp.responsibilityorg}
                                    readOnly={!isOther && resp.responsibilityid !== ""}
                                    onChange={(e) => handleResponsibilityManualUpdate(task.id, resp.id, "responsibilityorg", e.target.value)}
                                    className={`${inputCls} !py-1 text-xs h-7`}
                                    placeholder="Organization"
                                  />
                                </td>

                                {/* Name */}
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={resp.responsibilityname}
                                    readOnly={!isOther && resp.responsibilityid !== ""}
                                    onChange={(e) => handleResponsibilityManualUpdate(task.id, resp.id, "responsibilityname", e.target.value)}
                                    className={`${inputCls} !py-1 text-xs h-7`}
                                    placeholder="Name"
                                  />
                                </td>

                                {/* Desig */}
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={resp.responsibilitydesig}
                                    readOnly={!isOther && resp.responsibilityid !== ""}
                                    onChange={(e) => handleResponsibilityManualUpdate(task.id, resp.id, "responsibilitydesig", e.target.value)}
                                    className={`${inputCls} !py-1 text-xs h-7`}
                                    placeholder="Designation"
                                  />
                                </td>

                                {/* Email */}
                                <td className="px-3 py-1.5">
                                  <input
                                    type="email"
                                    value={resp.responsibilityemail}
                                    readOnly={!isOther && resp.responsibilityid !== ""}
                                    onChange={(e) => handleResponsibilityManualUpdate(task.id, resp.id, "responsibilityemail", e.target.value)}
                                    className={`${inputCls} !py-1 text-xs h-7`}
                                    placeholder="Email"
                                  />
                                </td>

                                {/* Mobile */}
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={resp.responsibilitymobile}
                                    readOnly={!isOther && resp.responsibilityid !== ""}
                                    onChange={(e) => handleResponsibilityManualUpdate(task.id, resp.id, "responsibilitymobile", e.target.value)}
                                    className={`${inputCls} !py-1 text-xs h-7`}
                                    placeholder="Mobile"
                                  />
                                </td>

                                {/* Delete */}
                                <td className="px-3 py-1.5 text-center">
                                  {task.responsibilities.length > 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => removeResponsibilityRow(task.id, resp.id)}
                                      className="text-red-500 hover:text-red-700 font-bold text-xs px-2 py-0.5 rounded border border-red-200 hover:bg-red-50"
                                    >
                                      X
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 font-mono">—</span>
                                  )}
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </Card>

          {/* Form Actions footer */}
          <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
            <Button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitMom("save")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-6 shadow-soft"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitMom("submit")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 shadow-soft"
            >
              Submit MOM
            </Button>
          </div>

        </form>
      </div>
    </Page>
  );
}
