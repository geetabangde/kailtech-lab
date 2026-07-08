import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button, Input, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";

export default function EditRole() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  const [modules, setModules] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPermissions: [], // Array of permission IDs
  });

  // Fetch Role, Modules and Permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [roleRes, modulesRes, permissionsRes] = await Promise.all([
          axios.get(`rolemanagment/get-role-byid/${id}`),
          axios.get("rolemanagment/get-module"),
          axios.get("/rolemanagment/get-permissions"),
        ]);

        // Process Role Data
        const roleResult = roleRes.data;
        if (roleResult.status === "true" || roleResult.status === true) {
          const roleData = Array.isArray(roleResult.data) ? roleResult.data[0] : roleResult.data;
          
          let selectedPerms = [];
          const rawPerms = roleData?.permissions || roleData?.permission;
          
          if (typeof rawPerms === 'string') {
             selectedPerms = rawPerms.split(',').map(String);
          } else if (Array.isArray(rawPerms)) {
             selectedPerms = rawPerms.map(p => typeof p === 'object' ? String(p.id) : String(p));
          }

          setFormData({
            name: roleData?.name || "",
            description: roleData?.description || "",
            selectedPermissions: selectedPerms.map(String),
          });
        } else {
          toast.error(roleResult.message || "Failed to load role data.");
        }

        // Process Modules
        let modulesList = [];
        if (modulesRes.data.status || modulesRes.data.success) {
          modulesList = [...(modulesRes.data.data || [])];
        }

        // Process Permissions
        if (permissionsRes.data.success || permissionsRes.data.status) {
          const newModules = [];
          const grouped = (permissionsRes.data.data || [])
            .filter(perm => perm.status == 1 || perm.status === "1" || perm.status === undefined)
            .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
            .reduce((acc, perm) => {
              let moduleId = perm.module || perm.module_id;

              if (!moduleId && perm.module_name) {
                const matched = modulesList.find(
                  m => m.name?.trim().toLowerCase() === perm.module_name?.trim().toLowerCase()
                );
                if (matched) {
                  moduleId = matched.id;
                } else {
                  const nameKey = perm.module_name.trim();
                  const matchedNew = newModules.find(m => m.name?.trim().toLowerCase() === nameKey.toLowerCase());
                  if (matchedNew) {
                    moduleId = matchedNew.id;
                  } else {
                    const newId = nameKey;
                    newModules.push({ id: newId, name: nameKey });
                    moduleId = newId;
                  }
                }
              }

              if (!moduleId) {
                moduleId = "Other";
              }

              if (!acc[moduleId]) acc[moduleId] = [];
              acc[moduleId].push(perm);
              return acc;
            }, {});

          setModules([...modulesList, ...newModules]);
          setGroupedPermissions(grouped);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load role configuration");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePermissionChange = (permId) => {
    const pIdStr = String(permId);
    setFormData((prev) => {
      const isSelected = prev.selectedPermissions.includes(pIdStr);
      if (isSelected) {
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter((pid) => pid !== pIdStr),
        };
      } else {
        return {
          ...prev,
          selectedPermissions: [...prev.selectedPermissions, pIdStr],
        };
      }
    });
  };

  const handleSelectAllModule = (moduleId, isChecked) => {
    const modulePerms = groupedPermissions[moduleId] || [];
    const modulePermIds = modulePerms.map(p => String(p.id));

    setFormData((prev) => {
      if (isChecked) {
        const others = prev.selectedPermissions.filter(pid => !modulePermIds.includes(String(pid)));
        return {
          ...prev,
          selectedPermissions: [...others, ...modulePermIds],
        };
      } else {
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter(pid => !modulePermIds.includes(String(pid))),
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Role Name is required";
    if (formData.selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        id: Number(id),
        name: formData.name,
        description: formData.description,
        permissions: formData.selectedPermissions
      };

      const response = await axios.post("/rolemanagment/update-roles", payload);
      const result = response.data;

      if (result.status === "true" || result.status === true) {
        toast.success("Role updated successfully", {
          duration: 1000,
          icon: "✅",
        });
        navigate("/dashboards/role-management/roles");
      } else {
        toast.error(result.message || "Failed to update role");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Page title="Edit Role">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading Configuration...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Role">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Role</h1>
            <p className="text-sm text-gray-500 mt-1">Configure role name, description and access permissions</p>
          </div>
          <Button
            variant="flat"
            onClick={() => navigate("/dashboards/role-management/roles")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Roles
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column: Role Details */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Role Name"
                      name="name"
                      placeholder="e.g. Sales Manager"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                    />
                  </div>
                  <div>
                    <Input
                      label="Role Description"
                      name="description"
                      placeholder="e.g. Access to sales reports and invoices"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </Card>

              {/* Permissions Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-2">
                  Module Permissions
                </h3>

                {modules.map((module) => {
                  const modulePerms = groupedPermissions[module.id] || [];
                  if (modulePerms.length === 0) return null;

                  const allSelected = modulePerms.every(p => formData.selectedPermissions.includes(String(p.id)));
                  const someSelected = modulePerms.some(p => formData.selectedPermissions.includes(String(p.id))) && !allSelected;

                  return (
                    <Card key={module.id} className="overflow-hidden border-none shadow-sm">
                      <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 flex items-center justify-between border-b dark:border-dark-700">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`mod-all-${module.id}`}
                            className={clsx(
                              "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                              someSelected && "accent-blue-400"
                            )}
                            checked={allSelected}
                            onChange={(e) => handleSelectAllModule(module.id, e.target.checked)}
                          />
                          <label htmlFor={`mod-all-${module.id}`} className="font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                            {module.name}
                          </label>
                        </div>
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          {modulePerms.length} Permissions
                        </span>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {modulePerms.map((perm) => (
                          <div key={perm.id} className="flex items-start gap-2 group">
                            <input
                              type="checkbox"
                              id={`perm-${perm.id}`}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              checked={formData.selectedPermissions.includes(String(perm.id))}
                              onChange={() => handlePermissionChange(perm.id)}
                            />
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                            >
                              {perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <Button
                  type="submit"
                  color="primary"
                  className="w-full justify-center py-2 text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none mb-4"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Updating...
                    </div>
                  ) : (
                    "Update Role"
                  )}
                </Button>

                <div className="space-y-4">
                  <div className="pt-4 border-t dark:border-dark-700">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Summary</h4>
                    <ul className="text-xs space-y-2 text-gray-500">
                      <li className="flex justify-between">
                        <span>Modules:</span>
                        <span className="font-bold text-blue-600">{modules.filter(m => groupedPermissions[m.id]?.some(p => formData.selectedPermissions.includes(String(p.id)))).length}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Permissions:</span>
                        <span className="font-bold text-blue-600">{formData.selectedPermissions.length}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}
