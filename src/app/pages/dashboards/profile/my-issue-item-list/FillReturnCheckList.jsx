import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";

export default function FillReturnCheckList() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get("hakuna") || "";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [instruments, setInstruments] = useState([]);

    // States for the dynamic tables
    const [matrixList, setMatrixList] = useState([]);
    const [generalList, setGeneralList] = useState([]);

    useEffect(() => {
        if (!id) {
            toast.error("Record ID not found in URL");
            setLoading(false);
            return;
        }
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // NOTE: Replace these API URLs with the actual ones on your backend.
            const [resChecklist, resInstruments] = await Promise.all([
                axios.get("/profile/get-return-checklist", { params: { id } }),
                axios.get("/profile/get-active-instruments"),
            ]);

            if (resChecklist.data?.status) {
                setMatrixList(resChecklist.data.matrix || []);
                setGeneralList(resChecklist.data.general || []);
            } else {
                toast.error(resChecklist.data?.message || "Failed to load checklists");
            }

            if (resInstruments.data?.status) {
                setInstruments(resInstruments.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching checklist data:", err);
            toast.error("API error fetching return checklist data.");
            setMatrixList([]);
            setGeneralList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMatrixChange = (index, field, value) => {
        const newList = [...matrixList];
        newList[index][field] = value;

        // Auto-calculate error and result when checkpointaftermoving changes
        if (field === "checkpointaftermoving" && newList[index].checkpoint !== "NA") {
            const before = parseFloat(newList[index].checkpointbeforemoving);
            const after = parseFloat(value);

            if (!isNaN(before) && !isNaN(after)) {
                const errorVal = after - before;
                newList[index].error = errorVal.toFixed(2); // Keep it formatted

                const acceptLimit = parseFloat(newList[index].acceptancelimit);
                if (!isNaN(acceptLimit)) {
                    if (Math.abs(errorVal) <= Math.abs(acceptLimit)) {
                        newList[index].result = "Pass";
                    } else {
                        newList[index].result = "Fail";
                    }
                }
            }
        }

        setMatrixList(newList);
    };

    const handleGeneralChange = (index, field, value) => {
        const newList = [...generalList];
        newList[index][field] = value;
        setGeneralList(newList);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation mirroring the PHP HTML5 required checks
        let isValid = true;
        matrixList.forEach((row) => {
            if (row.checkpoint !== "NA" && !row.checkpointaftermoving) {
                toast.error("Check Point After Moving is required.");
                isValid = false;
            }
            if (row.checkpoint === "NA" && !row.rremark) {
                toast.error("Return Remark is required when Check Point is NA.");
                isValid = false;
            }
        });

        if (!isValid) return;

        try {
            setSubmitting(true);

            const payload = {
                id,
                matrix: matrixList,
                general: generalList,
            };

            // NOTE: Update this API path to match insertReturnChecklist.php equivalent
            const res = await axios.post("/profile/insert-return-checklist", payload);

            if (res.data?.status) {
                toast.success(res.data.message || "Return Checklist Submitted Successfully");
                navigate(-1); // Or back to specific issue list
            } else {
                toast.error(res.data?.message || "Submission failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during submission.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Page title={`Fill Return Checklist - ${id}`}>
                <div className="p-5">Loading checklist data...</div>
            </Page>
        );
    }

    return (
        <Page title={`Fill Return Checklist`}>
            <div className="p-5">
                <Card className="border-none shadow-soft dark:bg-dark-700">
                    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                            Fill Item List
                        </h3>
                        <Link to="/dashboards/profile/my-issue-item-list">
                            <Button color="info" variant="solid">
                                &laquo; Issued Item list
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4">
                        {/* Table 1: Checklist Matrix */}
                        <div className="overflow-x-auto mb-6">
                            <Table className="w-full text-left">
                                <THead>
                                    <Tr>
                                        <Th>Sr no</Th>
                                        <Th>Master Equipment</Th>
                                        <Th>Discipline</Th>
                                        <Th>Artifact for verification</Th>
                                        <Th>General Check</Th>
                                        <Th>Unit</Th>
                                        <Th>Check Point</Th>
                                        <Th>Check Point Before Moving</Th>
                                        <Th>Check Point After Moving</Th>
                                        <Th>Deviation</Th>
                                        <Th>Acceptance</Th>
                                        <Th>Result</Th>
                                        <Th>Remarks</Th>
                                        <Th>Return Remarks</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {matrixList.length > 0 ? (
                                        matrixList.map((row, idx) => (
                                            <Tr key={idx}>
                                                <Td>{idx + 1}</Td>
                                                <Td>{`${row.name || row.instrument_name || row.equipment_name || ""} (${row.idno || row.instrument_no || row.equipment_idno || ""})`}</Td>
                                                <Td>{row.discipline_name || row.discipline || ""}</Td>
                                                <Td>
                                                    <select
                                                        className="form-select text-sm w-32 bg-gray-100"
                                                        value={row.equipformverif || ""}
                                                        disabled
                                                    >
                                                        <option value=""></option>
                                                        {instruments.map((inst) => (
                                                            <option key={inst.id} value={inst.id}>
                                                                {inst.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.generalcheck || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>{row.unit_description}</Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.checkpoint || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.checkpointbeforemoving || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.checkpointaftermoving || ""}
                                                        onChange={(e) => handleMatrixChange(idx, "checkpointaftermoving", e.target.value)}
                                                        className="form-input text-sm w-24"
                                                        readOnly={row.checkpoint === "NA"}
                                                        required={row.checkpoint !== "NA"}
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.error || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.acceptancelimit || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.result || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.remark || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.rremark || ""}
                                                        onChange={(e) => handleMatrixChange(idx, "rremark", e.target.value)}
                                                        className="form-input text-sm w-24"
                                                        required={row.checkpoint === "NA"}
                                                    />
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr>
                                            <Td colSpan={14} className="text-center p-4">No Matrix Records Found</Td>
                                        </Tr>
                                    )}
                                </TBody>
                            </Table>
                        </div>

                        {/* Table 2: General Checklist Matrix */}
                        <div className="overflow-x-auto mb-6">
                            <Table className="w-full text-left">
                                <THead>
                                    <Tr>
                                        <Th>Sr no</Th>
                                        <Th>Master Equipment</Th>
                                        <Th>Accessories name</Th>
                                        <Th>Quantity</Th>
                                        <Th>Condition</Th>
                                        <Th>Remarks</Th>
                                        <Th>Return Condition</Th>
                                        <Th>Return Remarks</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {generalList.length > 0 ? (
                                        generalList.map((row, idx) => (
                                            <Tr key={idx}>
                                                <Td>{idx + 1}</Td>
                                                <Td>{`${row.name || row.instrument_name || row.equipment_name || ""} (${row.idno || row.instrument_no || row.equipment_idno || ""})`}</Td>
                                                <Td>{row.accessoriesname || row.accessories_name || ""}</Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.quantity || row.qty || ""}
                                                        className="form-input text-sm w-24 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.condition || ""}
                                                        className="form-input text-sm w-32 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.remark || row.remarks || ""}
                                                        className="form-input text-sm w-32 bg-gray-100"
                                                        readOnly
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.rcondition || ""}
                                                        onChange={(e) => handleGeneralChange(idx, "rcondition", e.target.value)}
                                                        className="form-input text-sm w-32"
                                                    />
                                                </Td>
                                                <Td>
                                                    <input
                                                        type="text"
                                                        value={row.rremark1 || ""}
                                                        onChange={(e) => handleGeneralChange(idx, "rremark1", e.target.value)}
                                                        className="form-input text-sm w-32"
                                                    />
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr>
                                            <Td colSpan={8} className="text-center p-4">No General Records Found</Td>
                                        </Tr>
                                    )}
                                </TBody>
                            </Table>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-500">
                            <Button type="submit" color="info" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Page>
    );
}
