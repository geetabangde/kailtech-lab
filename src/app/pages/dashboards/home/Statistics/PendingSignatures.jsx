import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { Card, Avatar } from "components/ui";
import { PencilSquareIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export function PendingSignatures() {
    const [pendingCount, setPendingCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const response = await axios.get("/approvals/get-pending-signatures");
                // Adjust this depending on the API response structure
                if (response.data && response.data.data) {
                    setPendingCount(response.data.data.length || 0);
                } else if (response.data && response.data.count !== undefined) {
                    setPendingCount(response.data.count);
                }
            } catch (error) {
                console.error("Error fetching pending signatures:", error);
            }
        };
        fetchPendingCount();
    }, []);

    return (
        <Card
            className="flex justify-between p-5 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/dashboards/approvals/approve-signature")}
        >
            <div>
                <p>Pending eSignature</p>
                <p className="this:error mt-0.5 text-2xl font-medium text-this dark:text-this-lighter">
                    {pendingCount}
                </p>
                <p className="this:error mt-3 flex items-center gap-1 text-this dark:text-this-lighter">
                    <span>Action Required</span>
                    <ArrowRightIcon className="size-4" />
                </p>
            </div>
            <Avatar
                size={12}
                classNames={{
                    display: "mask is-squircle rounded-none",
                }}
                initialVariant="soft"
                initialColor="error"
            >
                <PencilSquareIcon className="size-6" />
            </Avatar>
        </Card>
    );
}