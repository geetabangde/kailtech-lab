import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PlusIcon, MinusIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import axios from "utils/axios";
import { Button, Table, THead, TBody, Th, Tr, Td, Card } from "components/ui";
import { Page } from "components/shared/Page";
import ReactSelect from "react-select";

const SearchableSelect = ({ label, name, options, value, onChange }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <ReactSelect
        name={name}
        options={options}
        value={options.find(o => String(o.value) === String(value)) || null}
        onChange={(option) => onChange({ target: { name, value: option ? option.value : '' } })}
        isClearable
        styles={{
          control: (base) => ({ ...base, minHeight: '38px' }),
          menuPortal: base => ({ ...base, zIndex: 9999 })
        }}
        menuPortalTarget={document.body}
      />
    </div>
  );
};

const CRITICAL_CHECKPOINTS = [
  "Make video during unpacking the product or unpack the product in the presence of vendor representative",
  "Physical Condition of Product",
  "Product User/Service Manual",
  "Accessories as per Packing list",
  "Is technical requirement fulfill as per indent form",
  "Training required to operate/use the product",
  "Is Certificate received ?",
];

const RESULT_OPTIONS = [
  { label: "Available", value: "Available" },
  { label: "Not Available", value: "Not Available" },
  { label: "Yes", value: "Yes" },
  { label: "Not Required", value: "Not Required" },
];

export default function InstrumentVerificationForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fid = searchParams.get("hakuna");
  const locationid = searchParams.get("matata");

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([{
    sno: "", parameter: "", requirement: "", received: "", remarks: "", engineer: ""
  }]);
  const [checkpoints, setCheckpoints] = useState(CRITICAL_CHECKPOINTS.map(cp => ({ checkpoint: cp, result: "", remark: "" })));
  const [verifyStatus, setVerifyStatus] = useState("");

  // Dropdowns
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    if (fid && locationid) {
      fetchInstrumentData(fid, locationid);
      fetchDropdowns();
    }
  }, [fid, locationid]);

  const fetchInstrumentData = async (id, locid) => {
    try {
      const response = await axios.get(`inventory/edit-verification-form/${id}/${locid}`);
      if (response.data?.status && response.data?.data) {
        const { instrument, subcategory, location, verticals: apiVerticals } = response.data.data;
        
        // Merge the API data into our form state
        setFormData({
          ...instrument,
          ...location,
          critical: subcategory?.critical,
        });

        if (apiVerticals) {
          setVerticals(apiVerticals.map(v => ({ label: v.name, value: v.id })));
        }
      }
    } catch (err) {
      console.error("Error fetching instrument data:", err);
    }
  };

  const fetchDropdowns = async () => {
    try {
      // Fetch labs
      axios.get("/master/list-lab").then(res => {
        if (res.data?.status) setLabs(res.data.data.map(l => ({ label: l.name, value: String(l.id) })));
      }).catch(console.error);

      axios.get("/inventory/category-list").then(res => {
        if (res.data?.data) setCategories(res.data.data.map(c => ({ label: c.name, value: String(c.id) })));
      }).catch(console.error);

      axios.get("/inventory/subcategory-list").then(res => {
        if (res.data?.data) setSubcategories(res.data.data.map(c => ({ label: c.name, value: String(c.id) })));
      }).catch(console.error);

    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCriteria = (e) => {
    e.preventDefault();
    setAcceptanceCriteria([...acceptanceCriteria, { sno: "", parameter: "", requirement: "", received: "", remarks: "", engineer: "" }]);
  };

  const handleRemoveCriteria = (index, e) => {
    e.preventDefault();
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index, field, value) => {
    const newCriteria = [...acceptanceCriteria];
    newCriteria[index][field] = value;
    setAcceptanceCriteria(newCriteria);
  };

  const handleCheckpointChange = (index, field, value) => {
    const newCheckpoints = [...checkpoints];
    newCheckpoints[index][field] = value;
    setCheckpoints(newCheckpoints);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate scalar fields
    const requiredFields = [
      { key: "department", label: "Vertical" },
      { key: "name", label: "Instrument Name" },
      { key: "idno", label: "ID No" },
      { key: "serialno", label: "Serial No" },
      { key: "purchasedate", label: "Purchase Date" },
      { key: "allowedfor", label: "Instrument allowed for" },
      { key: "iscalibrationrequired", label: "Calibration Required" },
    ];

    for (const field of requiredFields) {
      if (!formData[field.key]) {
        alert(`Please fill out the required field: ${field.label}`);
        return;
      }
    }

    // Validate verify radio
    if (!verifyStatus) {
      alert("Please select a Verify Status (OK / Not OK)");
      return;
    }

    // Validate Acceptance Criteria
    for (let i = 0; i < acceptanceCriteria.length; i++) {
      const ac = acceptanceCriteria[i];
      if (!ac.parameter || !ac.requirement || !ac.received || !ac.remarks || !ac.engineer) {
        alert(`Please fill all required fields in Acceptance Criteria row ${i + 1}`);
        return;
      }
    }

    // Validate Critical Checkpoints
    if (isCritical) {
      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        if (!cp.result || !cp.remark) {
          alert(`Please fill all required fields in Critical Checkpoints row ${i + 1}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "0000-00-00") return "";
        const parts = dateStr.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
      };

      const payload = {
        ...formData,
        id: fid,
        locationid: locationid,
        verify: verifyStatus,
        purchasedate: formatDate(formData.purchasedate),
        mfddate: formatDate(formData.mfddate),
        expdate: formatDate(formData.expdate),
        parameter: acceptanceCriteria.map(a => a.parameter),
        requirement: acceptanceCriteria.map(a => a.requirement),
        received: acceptanceCriteria.map(a => a.received),
        remarks: acceptanceCriteria.map(a => a.remarks),
        engineer: acceptanceCriteria.map(a => a.engineer),
        checkpoint: isCritical ? checkpoints.map(c => c.checkpoint) : [],
        result: isCritical ? checkpoints.map(c => c.result) : [],
        remark: isCritical ? checkpoints.map(c => c.remark) : [],
      };

      const response = await axios.post("/inventory/update-verification-instrument", payload);
      
      if (response.data?.status) {
        alert(response.data?.message || "Instrument updated successfully");
        navigate(-1);
      } else {
        alert(response.data?.message || "Failed to update instrument");
      }
    } catch (err) {
      console.error("Error submitting verification:", err);
      alert(err.response?.data?.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  const isCritical = String(formData?.iscritical) === "1" || String(formData?.critical) === "1"; // Mock check based on subcategory

  return (
    <Page title="Edit MM Instrument / Verification">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-dark-100">Edit MM Instrument</h1>
        <Button onClick={() => navigate(-1)} variant="outline" color="secondary" className="flex items-center gap-2">
          <ArrowLeftIcon className="size-4" />
          Back to MM Instrument
        </Button>
      </div>

      <Card className="p-6">
        <form id="instrumentverification" onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect name="category" label="Category" options={categories} value={formData.category} onChange={handleFieldChange} />
            <SearchableSelect name="type" label="Product Type / Subcategory" options={subcategories} value={formData.type} onChange={handleFieldChange} />
            <SearchableSelect name="department" label="Vertical" options={verticals} value={formData.department} onChange={handleFieldChange} />
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Instrument Location</label>
              <input 
                type="text" 
                readOnly 
                value={labs.find(l => l.value === String(formData.instrumentlocation))?.label || ''} 
                className="rounded border bg-gray-100 px-3 py-2 text-sm dark:bg-dark-900 dark:border-dark-500" 
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Instrument Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500"></textarea>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Nick Name</label>
              <input type="text" name="nickname" value={formData.nickname || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">ID No</label>
              <input type="text" name="idno" value={formData.idno || ''} readOnly className="rounded border bg-gray-100 px-3 py-2 text-sm dark:bg-dark-900 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Serial No</label>
              <input type="text" name="serialno" value={formData.serialno || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Make</label>
              <input type="text" name="make" value={formData.make || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Model</label>
              <input type="text" name="model" value={formData.model || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Purchase Date</label>
              <input type="date" name="purchasedate" value={formData.purchasedate || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Name and Address of manufacturer</label>
              <textarea name="manufacturer" value={formData.manufacturer || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500"></textarea>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Batch no</label>
              <input type="text" name="batchno" value={formData.batchno || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">MFD Date</label>
              <input type="date" name="mfddate" value={formData.mfddate || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Expiry Date</label>
              <input type="date" name="expdate" value={formData.expdate || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Instrument Range</label>
              <input type="text" name="instrange" value={formData.instrange || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Accuracy</label>
              <input type="text" name="accuracy" value={formData.accuracy || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Least Count</label>
              <input type="text" name="leastcount" value={formData.leastcount || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Frequency of calibration if required</label>
              <input type="text" name="frequency" value={formData.frequency || ''} onChange={handleFieldChange} className="rounded border px-3 py-2 text-sm dark:bg-dark-800 dark:border-dark-500" />
            </div>

            <SearchableSelect name="allowedfor" label="Instrument allowed for" options={[{label:'Site',value:'Site'},{label:'Lab',value:'Lab'},{label:'Both',value:'Both'}]} value={formData.allowedfor} onChange={handleFieldChange} />
            <SearchableSelect name="iscalibrationrequired" label="Calibration Required" options={[{label:'Yes',value:'Yes'},{label:'No',value:'No'}]} value={formData.iscalibrationrequired} onChange={handleFieldChange} />
          </div>

          <hr className="dark:border-dark-500" />

          {/* Acceptance Criteria Table */}
          <div>
            <h4 className="mb-2 font-bold text-center">ACCEPTANCE CRITERIA (As per KTRC/QF/0604/01)</h4>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-sm">
                <THead>
                  <Tr>
                    <Th className="w-16">S.No.</Th>
                    <Th>PARAMETER</Th>
                    <Th>OUR REQUIREMENT</Th>
                    <Th>EQUIPMENT RECEIVED</Th>
                    <Th>REMARKS</Th>
                    <Th>VERIFYING ENGINEER</Th>
                    <Th className="w-12"></Th>
                  </Tr>
                </THead>
                <TBody>
                  {acceptanceCriteria.map((row, index) => (
                    <Tr key={index}>
                      <Td><input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={row.sno} onChange={e => handleCriteriaChange(index, 'sno', e.target.value)} /></Td>
                      <Td><input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={row.parameter} onChange={e => handleCriteriaChange(index, 'parameter', e.target.value)} required /></Td>
                      <Td><input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={row.requirement} onChange={e => handleCriteriaChange(index, 'requirement', e.target.value)} required /></Td>
                      <Td><input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={row.received} onChange={e => handleCriteriaChange(index, 'received', e.target.value)} required /></Td>
                      <Td><input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={row.remarks} onChange={e => handleCriteriaChange(index, 'remarks', e.target.value)} required /></Td>
                      <Td><input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={row.engineer} onChange={e => handleCriteriaChange(index, 'engineer', e.target.value)} required /></Td>
                      <Td>
                        {index > 0 && (
                          <button onClick={(e) => handleRemoveCriteria(index, e)} className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                            <MinusIcon className="size-4" />
                          </button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
            <button onClick={handleAddCriteria} className="mt-2 flex size-8 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600">
              <PlusIcon className="size-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-4 dark:bg-dark-800 rounded-lg">
            <label className="font-bold">Verify:</label>
            <label className="flex items-center gap-2">
              <input type="radio" name="verifyStatus" value="OK" checked={verifyStatus === 'OK'} onChange={(e) => setVerifyStatus(e.target.value)} /> OK
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="verifyStatus" value="Not OK" checked={verifyStatus === 'Not OK'} onChange={(e) => setVerifyStatus(e.target.value)} /> Not OK
            </label>
          </div>

          {isCritical && (
            <div>
              <h4 className="mb-2 font-bold">Critical Checkpoints</h4>
              <div className="overflow-x-auto">
                <Table className="w-full text-left text-sm">
                  <THead>
                    <Tr>
                      <Th>Check Points</Th>
                      <Th className="w-48">Available/Yes/No</Th>
                      <Th>Remarks</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {checkpoints.map((cp, index) => (
                      <Tr key={index}>
                        <Td className="whitespace-normal">{cp.checkpoint}</Td>
                        <Td>
                          <SearchableSelect 
                            name={`result_${index}`}
                            options={RESULT_OPTIONS}
                            value={cp.result}
                            onChange={(e) => handleCheckpointChange(index, "result", e.target.value)}
                          />
                        </Td>
                        <Td>
                          <input type="text" className="w-full rounded border px-2 py-1 dark:bg-dark-800 dark:border-dark-500" value={cp.remark} onChange={(e) => handleCheckpointChange(index, 'remark', e.target.value)} />
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-500">
            <Button onClick={() => navigate(-1)} variant="outline" color="secondary">Cancel</Button>
            <Button type="submit" color="primary" disabled={submitting}>
              {submitting ? "Updating..." : "Update Instrument"}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
