import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import Select from "react-select";

export default function FillCheckList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gatepass = searchParams.get("hakuna") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [instruments, setInstruments] = useState([]);

  // States for the dynamic tables
  const [matrixList, setMatrixList] = useState([]);
  const [generalList, setGeneralList] = useState([]);

  useEffect(() => {
    if (!gatepass) {
      toast.error("Gatepass not found in URL");
      setLoading(false);
      return;
    }
    fetchData();
  }, [gatepass]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const encodedGatepass = encodeURIComponent(gatepass);
      const res = await axios.get(`/profile/issue-checklist/${encodedGatepass}`);

      if (res.data?.status) {
        setMatrixList(res.data.itemChecklist || []);
        setGeneralList(res.data.generalChecklist || []);
        setInstruments(res.data.artifactsDropdown || []);
      } else {
        toast.error(res.data?.message || "Failed to load checklists");
      }
    } catch (err) {
      console.error("Error fetching checklist data:", err);
      toast.error("API error fetching checklist data.");
      setMatrixList([]);
      setGeneralList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMatrixChange = (index, field, value) => {
    const newList = [...matrixList];
    newList[index][field] = value;
    setMatrixList(newList);
  };

  const handleGeneralChange = (index, field, value) => {
    const newList = [...generalList];
    newList[index][field] = value;
    setGeneralList(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (matrixList.length === 0 && generalList.length === 0) {
      toast.error("No Matrix is Added");
      return;
    }

    // Basic Validation mirroring the PHP HTML5 required checks
    let isValid = true;
    matrixList.forEach((row) => {
      if (row.checkpoint !== "NA" && !row.checkpointbeforemoving) {
        toast.error("Check Point Before Moving is required.");
        isValid = false;
      }
      if (row.checkpoint === "NA" && !row.remark) {
        toast.error("Remark is required when Check Point is NA.");
        isValid = false;
      }
    });

    if (!isValid) return;

    try {
      setSubmitting(true);

      const payload = {
        gatepass,
        checklistmatrix: matrixList,
        generalmatrix: generalList,
      };

      // NOTE: Update this API path to match insertIssueChecklist.php equivalent
      const res = await axios.post("/profile/add-issue-check-list", payload);

      if (res.data?.status) {
        toast.success(res.data.message || "Checklist Submitted Successfully");
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
      <Page title={`Fill Checklist - ${gatepass}`}>
        <div className="p-5">Loading checklist data...</div>
      </Page>
    );
  }

  const instrumentOptions = instruments.map((inst) => ({
    value: inst.id,
    label: inst.name,
  }));

  return (
    <Page title={`Fill Checklist - ${gatepass}`}>
      <div className="p-5">
        <Card className="border-none shadow-soft dark:bg-dark-700">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
              Fill Item List {gatepass}
            </h3>
            <Link to="/dashboards/profile/my-issue-item-list">
              <Button color="info" variant="filled">
                &laquo; Issued Item list
              </Button>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            {/* Table 1: Checklist Matrix */}
            <h4 className="mb-3 font-semibold">Checklist Matrix</h4>
            <div className="overflow-x-auto mb-6">
              <Table className="w-full text-left [&_th]:px-2 [&_td]:px-2 [&_th]:text-xs">
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
                    <Th>Deviation</Th>
                    <Th>Acceptance</Th>
                    <Th>Result</Th>
                    <Th>Remarks</Th>
                  </Tr>
                </THead>
                <TBody>
                  {matrixList.length > 0 ? (
                    matrixList.map((row, idx) => (
                      <Tr key={idx}>
                        <Td>{idx + 1}</Td>
                        <Td className="whitespace-normal min-w-[150px] max-w-[200px] text-xs leading-tight">
                          {`${row.name || row.instrument_name || row.equipment_name || ""} (${row.idno || row.instrument_no || row.equipment_idno || ""})`}
                        </Td>
                        <Td>{row.discipline_name || row.discipline || ""}</Td>
                        <Td>
                          <Select
                            className="text-xs min-w-[140px]"
                            classNamePrefix="react-select"
                            options={instrumentOptions}
                            value={instrumentOptions.find((opt) => opt.value == row.equipformverif) || null}
                            onChange={(selectedOption) =>
                              handleMatrixChange(idx, "equipformverif", selectedOption ? selectedOption.value : "")
                            }
                            isClearable
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.generalcheck || ""}
                            className="form-input text-xs px-2 py-1.5 w-16 bg-gray-100 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                            readOnly
                          />
                        </Td>
                        <Td>
                          {row.unit_description}
                          <input type="hidden" value={row.unit || ""} />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.checkpoint || ""}
                            className="form-input text-xs px-2 py-1.5 w-16 bg-gray-100 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                            readOnly
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.checkpointbeforemoving || ""}
                            onChange={(e) => handleMatrixChange(idx, "checkpointbeforemoving", e.target.value)}
                            className="form-input text-xs px-2 py-1.5 w-16 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                            readOnly={row.checkpoint === "NA"}
                            required={row.checkpoint !== "NA"}
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.error || ""}
                            className="form-input text-xs px-2 py-1.5 w-16 bg-gray-100 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                            readOnly
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.acceptancelimit || ""}
                            className="form-input text-xs px-2 py-1.5 w-16 bg-gray-100 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                            readOnly
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.result || ""}
                            className="form-input text-xs px-2 py-1.5 w-16 bg-gray-100 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                            readOnly
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.remark || ""}
                            onChange={(e) => handleMatrixChange(idx, "remark", e.target.value)}
                            className="form-input text-xs px-2 py-1.5 w-16 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                            required={row.checkpoint === "NA"}
                          />
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={12} className="text-center p-4">No Matrix Records Found</Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            {/* Table 2: General Checklist Matrix */}
            <h4 className="mb-3 font-semibold">General Checklist</h4>
            <div className="overflow-x-auto mb-6">
              <Table className="w-full text-left [&_th]:px-2 [&_td]:px-2 [&_th]:text-xs">
                <THead>
                  <Tr>
                    <Th>Sr no</Th>
                    <Th>Master Equipment</Th>
                    <Th>Accessories name</Th>
                    <Th>Quantity</Th>
                    <Th>Condition</Th>
                    <Th>Remarks</Th>
                  </Tr>
                </THead>
                <TBody>
                  {generalList.length > 0 ? (
                    generalList.map((row, idx) => (
                      <Tr key={idx}>
                        <Td>{idx + 1}</Td>
                        <Td className="whitespace-normal min-w-[150px] max-w-[200px] text-xs leading-tight">
                          {`${row.name || row.instrument_name || row.equipment_name || ""} (${row.idno || row.instrument_no || row.equipment_idno || ""})`}
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.accessoriesname || row.accessories_name || ""}
                            onChange={(e) => handleGeneralChange(idx, "accessoriesname", e.target.value)}
                            className="form-input text-xs px-2 py-1.5 w-24 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.quantity || row.qty || ""}
                            className="form-input text-sm w-24 bg-gray-100 rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                            readOnly
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.condition || ""}
                            onChange={(e) => handleGeneralChange(idx, "condition", e.target.value)}
                            className="form-input text-xs px-2 py-1.5 w-24 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </Td>
                        <Td>
                          <input
                            type="text"
                            value={row.remark || row.remarks || ""}
                            onChange={(e) => handleGeneralChange(idx, "remark", e.target.value)}
                            className="form-input text-xs px-2 py-1.5 w-24 rounded border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={6} className="text-center p-4">No General Records Found</Td>
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
