import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EmployeeExtraPermissions() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [modules, setModules] = useState([]);
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFetching(true);
                // Fetch User's existing extra permissions along with available modules and permissions
                const [userPermsRes, modulesRes, permissionsRes] = await Promise.all([
                    axios.get(`/hrm/get-employee-permissions/${id}`),
                    axios.get("/rolemanagment/get-module"),
                    axios.get("/rolemanagment/get-permissions"),
                ]);

                // Process User Allotments for extra permissions
                const userResult = userPermsRes.data;
                if (userResult.status === "true" || userResult.status === true) {
                    const allotments = userResult.data?.allotments || {};
                    let extraPerms = [];
                    if (allotments.extrapermission) {
                        const rawExtra = allotments.extrapermission;
                        if (typeof rawExtra === 'string') {
                            extraPerms = rawExtra.split(',').map(String);
                        } else if (Array.isArray(rawExtra)) {
                            extraPerms = rawExtra.map(String);
                        }
                    }
                    setSelectedPermissions(extraPerms);
                }

                // Process Modules
                let modulesList = [];
                if (modulesRes.data?.status || modulesRes.data?.success) {
                    modulesList = [...(modulesRes.data.data || [])];
                }

                // Process Permissions
                if (permissionsRes.data?.success || permissionsRes.data?.status) {
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
                toast.error("Failed to load extra permissions configuration");
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePermissionChange = (permId) => {
        const pIdStr = String(permId);
        setSelectedPermissions((prev) => {
            if (prev.includes(pIdStr)) {
                return prev.filter((pid) => pid !== pIdStr);
            } else {
                return [...prev, pIdStr];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const form = new FormData();
            form.append("userid", id);
            selectedPermissions.forEach(perm => {
                form.append("extrapermission[]", perm);
            });

            const response = await axios.post(`/hrm/update-extra-permissions`, form);

            const result = response.data;
            if (result.status === "true" || result.status === true || result.success) {
                toast.success("Extra Permissions updated successfully ✅", {
                    duration: 1000,
                });
                navigate("/dashboards/hrm/manage-employee");
            } else {
                toast.error(result.message || "Failed to update extra permissions");
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
            <Page title="Manage Extra Permission">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-gray-600">Loading Configuration...</span>
                </div>
            </Page>
        );
    }

    return (
        <Page title="Manage Extra Permission">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Extra Permission</h1>
                    </div>
                    <Button
                        variant="flat"
                        onClick={() => navigate("/dashboards/hrm/manage-employee")}
                        className="text-white bg-blue-600 hover:bg-blue-700"
                    >
                        &lt;&lt; Back to Employee List
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {modules.map((module) => {
                            const modulePerms = groupedPermissions[module.id] || [];
                            if (modulePerms.length === 0) return null;

                            return (
                                <Card key={module.id} className="overflow-hidden border border-green-200 shadow-sm">
                                    <div className="bg-green-50 dark:bg-green-900/30 px-4 py-3 border-b border-green-200 dark:border-green-800">
                                        <h4 className="font-bold text-gray-800 dark:text-white text-lg">{module.name}</h4>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {modulePerms.map((perm) => (
                                            <div key={perm.id} className="flex items-start gap-2 group">
                                                <input
                                                    type="checkbox"
                                                    id={`perm-${perm.id}`}
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                    checked={selectedPermissions.includes(String(perm.id))}
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

                        <div className="pt-6">
                            <Button
                                type="submit"
                                className="w-full sm:w-auto px-8 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white"
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Update Extra Permission"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Page>
    );
}
