import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import Select from "react-select";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EmployeePermissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);

  const [formData, setFormData] = useState({
    role: "",
    authorizefor: "",
    attendancepolicy: "",
    leavepolicy: "",
    username: "",
    password: "",
    department: "",
    loginallowed: "Yes",
    employeeStatus: 1, // 1 for Active, 99 for Suspend
    timevalidation: "Yes",
    starttime: "",
    endtime: "",
    iprestrict: "On", // On for Office, Off for Site
    ip: "",
    reportingto: "",
    posting: "",
  });

  const [options, setOptions] = useState({
    roles: [],
    attendancepolicies: [],
    leavepolicies: [],
    departments: [],
    admins: [],
    branches: [],
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        // Assuming there is an endpoint that returns the permissions details and options
        // Fetch permissions, roles, and labs concurrently
        const [permResponse, rolesResponse, labsResponse] = await Promise.all([
          axios.get(`/hrm/get-employee-permissions/${id}`),
          axios.get(`/rolemanagment/get-roles`).catch(() => ({ data: { data: [] } })),
          axios.get(`/master/list-lab`).catch(() => ({ data: { data: [] } }))
        ]);
        
        const result = permResponse.data;
        const rolesData = rolesResponse.data?.data || [];
        const labsData = labsResponse.data?.data || [];

        if ((result.status === "true" || result.status === true) && result.data) {
          const d = result.data.allotments || {};
          const userD = result.data.employee || {}; 

          setFormData({
            role: d.role !== undefined && d.role !== null ? d.role : "",
            authorizefor: userD.authorizefor || "",
            attendancepolicy: d.attendancepolicy !== undefined && d.attendancepolicy !== null ? d.attendancepolicy : "",
            leavepolicy: d.leavepolicy !== undefined && d.leavepolicy !== null ? d.leavepolicy : "",
            username: userD.username || d.username || "",
            password: "", // Kept empty as optional
            department: userD.department !== undefined && userD.department !== null ? userD.department : "",
            loginallowed: d.loginallowed || "Yes",
            employeeStatus: userD.status !== undefined && userD.status !== null ? userD.status : 1,
            timevalidation: d.timevalidation || "Yes",
            starttime: d.starttime !== undefined && d.starttime !== null ? d.starttime : "",
            endtime: d.endtime !== undefined && d.endtime !== null ? d.endtime : "",
            iprestrict: d.iprestrict || "On",
            ip: d.ip || "",
            reportingto: d.reportingto !== undefined && d.reportingto !== null ? d.reportingto : "",
            posting: d.posting !== undefined && d.posting !== null ? d.posting : "",
          });

          if (userD.username || d.username) {
            setUsernameExists(true);
          }

          setOptions((prev) => ({
            ...prev,
            roles: rolesData,
            attendancepolicies: result.data.attendancepolicies || [],
            leavepolicies: result.data.leavepolicies || [],
            departments: labsData,
            admins: result.data.admins || [],
            branches: result.data.branches || [],
          }));
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleUsernameBlur = async () => {
    if (!formData.username || usernameExists) return;
    try {
      const response = await axios.post(`/hrm/check-username`, { username: formData.username });
      if (response.data.status === "error" || response.data === "error") {
        toast.error("Username already exists!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("userid", id);
      Object.keys(formData).forEach((key) => {
        form.append(key, formData[key] !== null ? formData[key] : "");
      });

      const response = await axios.post(`/hrm/update-userrole/${id}`, form);
      const result = response.data;

      if (result.status === "true" || result.status === true) {
        toast.success(result.message || "Permissions updated successfully ✅", {
          duration: 1000,
          icon: "✅",
        });
        navigate("/dashboards/hrm/manage-employee");
      } else {
        toast.error(result.message || "Failed to update permissions ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Employee Permissions">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Employee Permissions
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/hrm/manage-employee")}
          >
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          {/* Row 1 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Role</label>
            <div className="col-span-4">
              <Select
                name="role"
                value={options.roles.map(o => ({ value: o.id, label: o.name })).find(o => String(o.value) === String(formData.role)) || null}
                onChange={(selected) => handleSelectChange("role", selected)}
                options={options.roles.map(o => ({ value: o.id, label: o.name }))}
                isClearable
                placeholder="Select Role"
              />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Authorize For</label>
            <div className="col-span-4">
              <Input name="authorizefor" value={formData.authorizefor} onChange={handleChange} required />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Attendance Policy</label>
            <div className="col-span-4">
              <Select
                name="attendancepolicy"
                value={options.attendancepolicies.map(o => ({ value: o.id, label: o.name })).find(o => String(o.value) === String(formData.attendancepolicy)) || null}
                onChange={(selected) => handleSelectChange("attendancepolicy", selected)}
                options={options.attendancepolicies.map(o => ({ value: o.id, label: o.name }))}
                isClearable
                placeholder="Select Attendance Policy"
              />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Leave Policy</label>
            <div className="col-span-4">
              <Select
                name="leavepolicy"
                value={options.leavepolicies.map(o => ({ value: o.id, label: o.name })).find(o => String(o.value) === String(formData.leavepolicy)) || null}
                onChange={(selected) => handleSelectChange("leavepolicy", selected)}
                options={options.leavepolicies.map(o => ({ value: o.id, label: o.name }))}
                isClearable
                placeholder="Select Leave Policy"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Username</label>
            <div className="col-span-4">
              {usernameExists ? (
                <div className="w-full border rounded px-3 py-[7px] bg-gray-100 dark:bg-gray-800 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {formData.username}
                </div>
              ) : (
                <Input name="username" value={formData.username} onChange={handleChange} onBlur={handleUsernameBlur} required />
              )}
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Password (Optional)</label>
            <div className="col-span-4">
              <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Fill only if you want to change password" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Department</label>
            <div className="col-span-4">
              <Select
                name="department"
                value={options.departments.map(o => ({ value: o.id, label: o.name })).find(o => String(o.value) === String(formData.department)) || null}
                onChange={(selected) => handleSelectChange("department", selected)}
                options={options.departments.map(o => ({ value: o.id, label: o.name }))}
                isClearable
                placeholder="Select Department"
              />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 my-6" />

          {/* Row 5 - Radio Buttons */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Login Allowed</label>
            <div className="col-span-4 flex gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="loginallowed" value="Yes" checked={formData.loginallowed === "Yes"} onChange={handleChange} />
                Yes
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="loginallowed" value="No" checked={formData.loginallowed === "No"} onChange={handleChange} />
                No
              </label>
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Employee Status</label>
            <div className="col-span-4 flex gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="employeeStatus" value="1" checked={String(formData.employeeStatus) === "1"} onChange={handleChange} />
                Active
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="employeeStatus" value="99" checked={String(formData.employeeStatus) === "99"} onChange={handleChange} />
                Suspend
              </label>
            </div>
          </div>

          {/* Row 6 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Login Time Restriction</label>
            <div className="col-span-4 flex gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="timevalidation" value="Yes" checked={formData.timevalidation === "Yes"} onChange={handleChange} />
                Yes
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="timevalidation" value="No" checked={formData.timevalidation === "No"} onChange={handleChange} />
                No
              </label>
            </div>
          </div>

          {/* Row 7 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Login Start Time</label>
            <div className="col-span-4">
              <Select
                name="starttime"
                value={[...Array(24).keys()].map(i => ({ value: i, label: String(i) })).find(o => String(o.value) === String(formData.starttime)) || null}
                onChange={(selected) => handleSelectChange("starttime", selected)}
                options={[...Array(24).keys()].map(i => ({ value: i, label: String(i) }))}
                isClearable
                placeholder="Select Start Time"
              />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Login End Time</label>
            <div className="col-span-4">
              <Select
                name="endtime"
                value={[...Array(24).keys()].map(i => ({ value: i, label: String(i) })).find(o => String(o.value) === String(formData.endtime)) || null}
                onChange={(selected) => handleSelectChange("endtime", selected)}
                options={[...Array(24).keys()].map(i => ({ value: i, label: String(i) }))}
                isClearable
                placeholder="Select End Time"
              />
            </div>
          </div>

          {/* Row 8 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Login Allowed For</label>
            <div className="col-span-4 flex gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="iprestrict" value="On" checked={formData.iprestrict === "On"} onChange={handleChange} />
                Office
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="iprestrict" value="Off" checked={formData.iprestrict === "Off"} onChange={handleChange} />
                Site
              </label>
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">IP Validation</label>
            <div className="col-span-4">
              <Input name="ip" value={formData.ip} onChange={handleChange} placeholder="e.g. 192.168.1.1" />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 my-6" />

          {/* Row 9 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Reporting To</label>
            <div className="col-span-4">
              <Select
                name="reportingto"
                value={options.admins.map(o => ({ value: o.id, label: `${o.firstname} ${o.lastname}` })).find(o => String(o.value) === String(formData.reportingto)) || null}
                onChange={(selected) => handleSelectChange("reportingto", selected)}
                options={options.admins.map(o => ({ value: o.id, label: `${o.firstname} ${o.lastname}` }))}
                isClearable
                placeholder="Select Manager"
              />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Posting</label>
            <div className="col-span-4">
              <Select
                name="posting"
                value={options.branches.map(o => ({ value: o.id, label: `${o.name} ${o.location}` })).find(o => String(o.value) === String(formData.posting)) || null}
                onChange={(selected) => handleSelectChange("posting", selected)}
                options={options.branches.map(o => ({ value: o.id, label: `${o.name} ${o.location}` }))}
                isClearable
                placeholder="Select Branch"
              />
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Button type="submit" color="primary" disabled={loading} className="px-6 bg-[#007bff] hover:bg-blue-600 text-white border-blue-500">
              {loading ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
