import { useParams, useNavigate } from "react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function ViewProcessList() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processInfo, setProcessInfo] = useState(null);
    const [allPermissions, setAllPermissions] = useState([]);
    const [fetchingPermissions, setFetchingPermissions] = useState(false);

    const userPermissions = useMemo(() => 
        localStorage.getItem("userPermissions")?.split(",").map(Number) || []
    , []);

    const fetchProcessDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/roles/get-process-byid/${id}`);
            if (response.data && (response.data.status === true || response.data.status === "true")) {
                setProcessInfo(response.data.data);
            } else {
                toast.error("Failed to load process details");
            }
        } catch (err) {
            console.error("Error fetching process details:", err);
            toast.error("Error loading process information");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchPermissionsByModule = useCallback(async () => {
        try {
            setFetchingPermissions(true);
            const response = await axios.get("rolemanagment/get-permissions");
            if (response.data && (response.data.status === true || response.data.status === "true" || response.data.success === true)) {
                setAllPermissions(response.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching permissions:", err);
        } finally {
            setFetchingPermissions(false);
        }
    }, []);

    const permissionsList = useMemo(() => {
        if (!processInfo || !allPermissions.length) return [];
        return allPermissions.filter(p => {
            const matchesId = String(p.module) === String(id) || String(p.module_id) === String(id);
            const matchesName = p.module_name && processInfo.name && 
                p.module_name.trim().toLowerCase() === processInfo.name.trim().toLowerCase();
            return matchesId || matchesName;
        });
    }, [processInfo, allPermissions, id]);

    useEffect(() => {
        if (!userPermissions.includes(166)) {
            navigate("/dashboards/role-management/process-guide");
            return;
        }

        if (id) {
            fetchProcessDetails();
            fetchPermissionsByModule();
        }
    }, [id, fetchProcessDetails, fetchPermissionsByModule, userPermissions, navigate]);

    if (loading) {
        return (
            <Page title="View Process">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                        </svg>
                        <p className="text-gray-500 font-medium">Loading process details...</p>
                    </div>
                </div>
            </Page>
        );
    }

    return (
        <Page title="View Process">
            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Process Details: <span className="text-blue-600">{processInfo?.name}</span>
                        </h1>
                        <p className="text-gray-500 mt-1">{processInfo?.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/dashboards/role-management/process-guide/create")}
                            className="px-4"
                        >
                            + Add New Process
                        </Button>
                        <Button
                            variant="flat"
                            onClick={() => navigate("/dashboards/role-management/process-guide")}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back to List
                        </Button>
                    </div>
                </div>

                <Card className="p-0 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 dark:bg-dark-800 px-6 py-4 border-b border-gray-200 dark:border-dark-600">
                        <h3 className="font-bold text-gray-700 dark:text-dark-100 uppercase tracking-wider text-sm">
                            Associated Permissions
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        {fetchingPermissions ? (
                            <div className="p-12 text-center text-gray-500">Loading permissions list...</div>
                        ) : permissionsList.length > 0 ? (
                            <Table hoverable className="w-full text-left">
                                <THead>
                                    <Tr>
                                        <Th className="w-16">ID</Th>
                                        <Th className="min-w-[200px]">Permission Name</Th>
                                        <Th className="min-w-[300px]">Description</Th>
                                        <Th className="w-24 text-center">Actions</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {permissionsList.map((permission) => (
                                        <Tr key={permission.id}>
                                            <Td className="text-gray-500 text-xs">{permission.id}</Td>
                                            <Td className="font-semibold text-gray-800 dark:text-dark-100">
                                                {permission.name}
                                            </Td>
                                            <Td className="text-gray-600 dark:text-dark-300 text-sm whitespace-normal italic">
                                                {permission.description || "-"}
                                            </Td>
                                            <Td className="text-center">
                                                <Button
                                                    variant="flat"
                                                    size="xs"
                                                    color="primary"
                                                    onClick={() => navigate(`/dashboards/role-management/permissions/edit/${permission.id}`)}
                                                    className="font-bold"
                                                >
                                                    Edit
                                                </Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <div className="mb-2 text-3xl">📭</div>
                                No permissions found associated with this process module.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </Page>
    );
}
