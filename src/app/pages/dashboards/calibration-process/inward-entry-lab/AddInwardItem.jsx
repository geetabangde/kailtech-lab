import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import ReactSelect from "react-select";

export default function AddItem() {
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const calibLocation = urlParams.get("caliblocation") || "Lab";
  const calibAcc = urlParams.get("calibacc") || "Nabl";
  const pathSegments = window.location.pathname.split("/");
  const inwardId = pathSegments[pathSegments.length - 1];

  const [formData, setFormData] = useState({
    name: "",
    make: "",
    model: "",
    serialno: "",
    idno: "",
    accuracy: "",
    location: calibLocation,
    calibrationvalidity: "",
    sop: "",
    standard: [],
    letterref: "",
    accessories: "",
    conformitystatement: "",
    decisionrule: "Not Applicable",
    remark: "",
    conditiononrecieve: "Satisfactory",
    newLocation: "",
    quotation_id: "",
    pricematrixid: null,
    subtotal: "",
    discnumber: "",
    disctype: "₹",
    discount: "",
    pchargesnumber: "",
    pchargestype: "₹",
    pcharges: "",
    mobilisation: "",
    witnesscharges: "",
    gstnumber: 18,
    gsttype: "%",
    gst: "",
    freight: "",
    total: "",
  });
  const [loading, setLoading] = useState(false);
  const [instrumentList, setInstrumentList] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [instrumentDetails, setInstrumentDetails] = useState(null);
  const [calibrationRequest, setCalibrationRequest] = useState([]);
  const [priceMatrices, setPriceMatrices] = useState([]);
  const [calibrationMethods, setCalibrationMethods] = useState([]);
  const [calibrationStandards, setCalibrationStandards] = useState([]);
  const [showDecisionRule, setShowDecisionRule] = useState(false);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(true);
  const [sampleEntryByData, setSampleEntryByData] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false); 

  const instNo = 0;

  // Calculate subtotal, discount, pcharges, gst, and total
  const calculateTotals = (data) => {
    let subtotal = parseFloat(data.subtotal) || 0;

    if (!subtotal && calibrationRequest.length > 0) {
      subtotal = calibrationRequest.reduce(
        (sum, item) => sum + (parseFloat(item.rate) || 0),
        0
      );
    }

    const discount =
      data.disctype === "%"
        ? (subtotal * (parseFloat(data.discnumber) || 0)) / 100
        : parseFloat(data.discnumber) || 0;

    const pcharges =
      data.pchargestype === "%"
        ? (subtotal * (parseFloat(data.pchargesnumber) || 0)) / 100
        : parseFloat(data.pchargesnumber) || 0;

    const gst =
      data.gsttype === "%"
        ? ((subtotal - discount + pcharges) * (parseFloat(data.gstnumber) || 0)) / 100
        : parseFloat(data.gstnumber) || 0;

    const mobilisation = parseFloat(data.mobilisation) || 0;
    const witnesscharges = parseFloat(data.witnesscharges) || 0;
    const freight = parseFloat(data.freight) || 0;

    const total =
      subtotal - discount + pcharges + mobilisation + witnesscharges + gst + freight;

    return {
      subtotal,
      discount,
      pcharges,
      gst,
      total,
    };
  };

  useEffect(() => {
    const fetchQuotationId = async () => {
      try {
        const res = await axios.get(`/calibrationprocess/get-inward-entry_byid/${inwardId}`);
        const result = res.data;
        if (result.status === "true" && result.data) {
          setFormData((prev) => ({
            ...prev,
            quotation_id: result.data.quotationid || "",
          }));
        }
      } catch (err) {
        console.error("Quotation API Error:", err.response?.data || err);
      }
    };

    const fetchInstrumentList = async () => {
  setLoading(true);
  try {
    const res = await axios.get(`/material/get-instruments-list?location=${calibLocation}`);
    const result = res.data;
    // console.log("dad", result);

    if (result.success && result.data) {   // ✅ yaha fix
      setInstrumentList(result.data);
    }
  } catch (err) {
    console.error("Instrument API Error:", err.response?.data || err);
  } finally {
    setLoading(false);
  }
};
    const fetchCalibrationRequest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/calibrationprocess/get-calibration-request?inwardid=${inwardId}`);
        const result = res.data;
        if (result && result.data && Array.isArray(result.data.instruments)) {
          setCalibrationRequest(result.data.instruments);
          setFormData((prev) => ({
            ...prev,
            subtotal: result.data.subtotal || 0,
          }));
        } else {
          setCalibrationRequest([]);
        }
      } catch (err) {
        console.error("Calibration Request API Error:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSampleEntryBy = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/calibrationprocess/get-inward-entry_byid/${inwardId}`);
        const result = res.data;
        if (result.status === true && result.data) {
          setSampleEntryByData(result.data);
        } else {
          setSampleEntryByData(null);
        }
      } catch (err) {
        console.error("Sample Entry By API Error:", err.response?.data || err);
        setSampleEntryByData(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchInstrumentDetails = async () => {
  //             console.log("useEffect triggered with dependencies:", {
  //   inwardId,
  //   selectedInstrument,
  //   calibLocation,
  //   calibAcc,
  //   quotationid: sampleEntryByData?.quotationid ??0,
  // });
      if (!selectedInstrument) return;

      try {

        setLoading(true);
        const params = {
          inwardid: inwardId,
          instno: instNo,
          instid: selectedInstrument,
          nabl: calibAcc,
          instlocation: calibLocation,
          quoteid: sampleEntryByData?.quotationid ?? 0,
        };
       
        const res = await axios.post(`/calibrationprocess/instrument-details`, params);
        const result = res.data;
        console.log(result);
        if (result.status === true || result.status === "true") {
          setInstrumentDetails(result.instrument);
          setPriceMatrices(result.price_matrix || []);
          setFormData((prev) => ({
            ...prev,
            name: result.instrument?.name || "",
            sop: result.instrument?.sop || "",
            standard: result.instrument?.standard
              ? result.instrument.standard.split(",").map(Number)
              : [],
            pricematrixid: null,
          }));
        }
      } catch (err) {
        console.error("Instrument Details API Error:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };


    fetchQuotationId();
    fetchInstrumentList();
    fetchCalibrationRequest();
    fetchSampleEntryBy();
    if (selectedInstrument) fetchInstrumentDetails();
  }, [inwardId, selectedInstrument, calibLocation, calibAcc]);

  useEffect(() => {
    const fetchCalibrationMethods = async () => {
      if (!formData.sop) return;
      try {
        const res = await axios.get(`/calibrationoperations/calibration-method-byid/${formData.sop}`);
        const result = res.data;
        if (result.status === "true" && result.data) {
          setCalibrationMethods([result.data]);
        }
      } catch (err) {
        console.error("Calibration Methods API Error:", err.response?.data || err);
      }
    };

    fetchCalibrationMethods();
  }, [formData.sop]);

  useEffect(() => {
    const fetchCalibrationStandards = async () => {
      if (!formData.standard || formData.standard.length === 0) return;
      try {
        const promises = formData.standard.map((id) =>
          axios.get(`/calibrationoperations/calibration-standard-byid/${id}`)
        );
        const responses = await Promise.all(promises);
        const data = responses.map((res) => {
          const result = res.data;
          if (result.status === "true" && result.data) {
            return result.data;
          }
          return null;
        }).filter(Boolean);
        setCalibrationStandards(data);
      } catch (err) {
        console.error("Calibration Standards API Error:", err.response?.data || err);
      }
    };

    fetchCalibrationStandards();
  }, [formData.standard]);

  useEffect(() => {
    const { subtotal, discount, pcharges, gst, total } = calculateTotals(formData);
    setFormData((prev) => ({
      ...prev,
      subtotal,
      discount,
      pcharges,
      gst,
      total,
    }));
  }, [
    formData.subtotal,
    formData.discnumber,
    formData.disctype,
    formData.pchargesnumber,
    formData.pchargestype,
    formData.mobilisation,
    formData.witnesscharges,
    formData.gstnumber,
    formData.gsttype,
    formData.freight,
    calibrationRequest,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("number") ? parseFloat(value) || 0 : value,
    }));
    if (name === "conformitystatement") {
      setShowDecisionRule(value === "Yes");
      setFormData((prev) => ({
        ...prev,
        decisionrule: value === "Yes" ? "" : "Not Applicable",
      }));
    }
  };

  const handleStandardChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(Number(options[i].value));
    }
    setFormData((prev) => ({
      ...prev,
      standard: selected,
    }));
  };

  const handleAddItem = () => {
    if (selectedInstrument) {
      setLoading(true);
      setShowInstrumentDropdown(false);
      setFormData((prev) => ({
        ...prev,
        name: instrumentList.find((inst) => inst.id === selectedInstrument)?.name || "",
      }));
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleRemoveItem = () => {
    setShowInstrumentDropdown(true);
    setSelectedInstrument(null);
    setFormData((prev) => ({
      ...prev,
      name: "",
      make: "",
      model: "",
      serialno: "",
      idno: "",
      accuracy: "",
      calibrationvalidity: "2025-01-01",
      sop: "",
      standard: [],
      letterref: "",
      accessories: "",
      conformitystatement: "",
      decisionrule: "Not Applicable",
      remark: "",
      conditiononrecieve: "Satisfactory",
      newLocation: "",
      pricematrixid: null,
    }));
    setFormSubmitted(false); // Reset form submission state
  };

  const handleDeleteItem = async (itemId) => {
    try {
      setLoading(true);
      const res = await axios.delete(
        `/calibrationprocess/delete-Calibration-Instrument/${itemId}/${inwardId}`
      );
      const result = res.data;
      if (result.status === "true" || result.status === true) {
        toast.success("Item deleted successfully ✅");
        setCalibrationRequest((prev) =>
          prev.filter((item) => item.id !== itemId)
        );
      } else {
        console.error("Delete failed:", result.message || result);
      }
    } catch (err) {
      console.error("Delete Item API Error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

   
    if (
      !formData.name ||
      !formData.make ||
      !formData.model ||
      !formData.serialno ||
      !formData.idno ||
      !formData.accuracy ||
      !formData.calibrationvalidity ||
      // !formData.sop ||
      // formData.standard.length === 0 ||
      !formData.letterref ||
      !formData.accessories ||
      !formData.conformitystatement ||
      (formData.conformitystatement === "Yes" && !formData.decisionrule) ||
      !formData.remark ||
      !formData.conditiononrecieve ||
      !formData.newLocation ||
      !formData.pricematrixid
    ) {
      toast.error("Please fill all required fields ❌");
      setLoading(false);
      return;
    }

    if (!instrumentDetails) {
      toast.error("Instrument details not loaded ❌");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const instIndex = 1;
      const standardArray = Array.isArray(formData.standard)
        ? formData.standard.map(String)
        : [];

      const submitData = {
        inwardid: Number(inwardId),
        instid: String(selectedInstrument),
        instno: [instIndex.toString()],
        hakuna: "5",
        matata: "1",
        quoteid: String(sampleEntryByData?.quotationid || ""),
        instlocation: calibLocation,
        nabl: calibAcc,
        [`name${instIndex}`]: formData.name || "",
        [`instid${instIndex}`]: String(selectedInstrument) || "",
        [`make${instIndex}`]: formData.make || "",
        [`model${instIndex}`]: formData.model || "",
        [`serialno${instIndex}`]: formData.serialno || "",
        [`idno${instIndex}`]: formData.idno || "",
        [`accuracy${instIndex}`]: formData.accuracy || "",
        [`location${instIndex}`]: formData.location || calibLocation,
        [`calibrationvalidity${instIndex}`]: formData.calibrationvalidity || "",
        [`sop${instIndex}`]: formData.sop || "",
        [`standard${instIndex}`]: standardArray,
        [`letterref${instIndex}`]: formData.letterref || "",
        [`accessories${instIndex}`]: formData.accessories || "",
        [`conditiononrecieve${instIndex}`]: formData.conditiononrecieve || "Satisfactory",
        [`conformitystatement${instIndex}`]: formData.conformitystatement || "No",
        [`decisionrule${instIndex}`]: formData.decisionrule || "Not Applicable",
        [`remark${instIndex}`]: formData.remark || "",
        [`newLocation${instIndex}`]: formData.newLocation || "",
        [`temp${instIndex}`]: String(instrumentDetails?.templab || ""),
        [`tempvariable${instIndex}`]: String(instrumentDetails?.tempvariablelab || ""),
        [`humi${instIndex}`]: String(instrumentDetails?.humilab || ""),
        [`humivariable${instIndex}`]: String(instrumentDetails?.humivariablelab || ""),
        [`pricematrixid${instIndex}`]: formData.pricematrixid ? [formData.pricematrixid] : [],
      };

      if (formData.pricematrixid) {
        const matrix = priceMatrices.find((m) => m.id === formData.pricematrixid);
        if (matrix) {
          const pid = formData.pricematrixid;
          submitData[`price1packagename${pid}`] = [matrix.packagename || ""];
          submitData[`price1packagedesc${pid}`] = [matrix.packagedesc || ""];
          submitData[`price1accreditation${pid}`] = [matrix.accreditation || ""];
          submitData[`price1rate${pid}`] = [String(matrix.rate || 0)];
          submitData[`price1currency${pid}`] = ["INR"];
          submitData[`price1daysrequired${pid}`] = [matrix.location || ""];
        }
      }
      console.log(submitData,"id",selectedInstrument);

      const res = await axios.post(
        "/calibrationprocess/save-inward-item",
        submitData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = res.data;

      if (result.status === "true") {
        toast.success("Item saved successfully ✅");
        setFormData((prev) => ({
          ...prev,
          name: "",
          make: "",
          model: "",
          serialno: "",
          idno: "",
          accuracy: "",
          location: calibLocation,
          calibrationvalidity: "2025-01-01",
          sop: "",
          standard: [],
          letterref: "",
          accessories: "",
          conformitystatement: "",
          decisionrule: "Not Applicable",
          remark: "",
          conditiononrecieve: "Satisfactory",
          newLocation: "",
          pricematrixid: null,
        }));
        setSelectedInstrument(null);
        setShowInstrumentDropdown(true);
        setFormSubmitted(false); // Reset form submission state
      } else {
        toast.error(result.message || "Failed to save item ❌");
      }
    } catch (err) {
      console.error("Save Item API Error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Error saving item ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInwardEntry = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        inwardid: inwardId,
        caliblocation: calibLocation,
        calibacc: calibAcc,
        subtotal: formData.subtotal,
        discnumber: formData.discnumber,
        disctype: formData.disctype === "%" ? "percentage" : "amount",
        discount: formData.discount,
        witnesscharges: formData.witnesscharges,
        pchargesnumber: formData.pchargesnumber,
        pchargestype: formData.pchargestype === "%" ? "percentage" : "amount",
        pcharges: formData.pcharges,
        mobilisation: formData.mobilisation,
        gstnumber: formData.gstnumber,
        gsttype: formData.gsttype === "%" ? "percentage" : "amount",
        gst: formData.gst,
        freight: formData.freight,
        total: formData.total,
      };

      const res = await axios.post("/calibrationprocess/submit-inward-entry", submitData);
      const result = res.data;

      if (result.status === "true") {
        toast.success("Inward entry submitted successfully ✅");
        navigate(
          `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
            calibLocation
          )}&calibacc=${encodeURIComponent(calibAcc)}`
        );
      } else {
        toast.error(result.message || "Failed to submit inward entry ❌");
      }
    } catch (err) {
      console.error("Submit Inward Entry API Error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Error submitting inward entry ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Inward Item">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add Inward Item
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              navigate(
                `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
                  calibLocation
                )}&calibacc=${encodeURIComponent(calibAcc)}`
              )
            }
          >
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSaveItem} className="space-y-4">
          <input type="hidden" name="quotation_id" value={formData.quotation_id} />
          <input type="hidden" name="instno" value={instNo} />
          <input type="hidden" name="temp" value={instrumentDetails?.templab || ""} />
          <input type="hidden" name="tempvariable" value={instrumentDetails?.tempvariablelab || ""} />
          <input type="hidden" name="humi" value={instrumentDetails?.humilab || ""} />
          <input type="hidden" name="humivariable" value={instrumentDetails?.humivariablelab || ""} />

          <h4 className="text-md font-semibold mb-2">1. Quotation Info</h4>
          <div className="mb-3">
            <p>View Quotation</p>
            <Button
              type="button"
              color="primary"
              variant="filled"
              className="px-2 py-1"
              onClick={() =>
                window.open(
                  `/dashboards/calibration-process/inward-entry-lab/quotation/view/${sampleEntryByData?.quotationid}?caliblocation=${encodeURIComponent(calibLocation)}&calibacc=${encodeURIComponent(calibAcc)}`,
                  "_blank"
                )
              }
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Loading...
                </div>
              ) : (
                "View Quotation"
              )}
            </Button>
          </div>

          <hr className="my-4" />

          <h4 className="text-md font-semibold mb-2">2. Calibration REQUEST (Equipment Description)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 table-auto">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="border px-3 py-2 text-left">S. No.</th>
                  <th className="border px-3 py-2 text-left">Name</th>
                  <th className="border px-3 py-2 text-left">Id no</th>
                  <th className="border px-3 py-2 text-left">Serial no</th>
                  <th className="border px-3 py-2 text-left">Make</th>
                  <th className="border px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calibrationRequest.length > 0 ? (
                  calibrationRequest.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border px-3 py-2">{index + 1}</td>
                      <td className="border px-3 py-2">{item.name}</td>
                      <td className="border px-3 py-2">{item.idno || "N/A"}</td>
                      <td className="border px-3 py-2">{item.serialno || "N/A"}</td>
                      <td className="border px-3 py-2">{item.make || "N/A"}</td>
                      <td className="border px-3 py-2">
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="filled"
                            className="text-white bg-red-600 hover:bg-red-700 px-2 py-1"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Delete
                          </Button>
                          <Button
                            type="button"
                            color="primary"
                            variant="filled"
                            className="px-2 py-1"
                            onClick={() => {
                              setSelectedInstrument(item.instid);
                              setFormData({
                                ...formData,
                                name: item.name,
                                make: item.make,
                                model: item.model,
                                serialno: item.serialno,
                                idno: item.idno,
                                accuracy: item.accuracy,
                                calibrationvalidity: item.calibrationvalidity,
                                sop: item.sop,
                                standard: item.standard ? item.standard.split(",").map(Number) : [],
                                letterref: item.letterref,
                                accessories: item.accessories,
                                conformitystatement: item.conformitystatement,
                                decisionrule: item.decisionrule,
                                remark: item.remark,
                                conditiononrecieve: item.conditiononrecieve,
                                newLocation: item.newLocation,
                                pricematrixid: item.pricematrixid || null,
                              });
                              setShowInstrumentDropdown(false);
                            }}
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4 text-white"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                                  ></path>
                                </svg>
                                Cloning...
                              </div>
                            ) : (
                              "Clone"
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center p-2">
                      No Instrument Selected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showInstrumentDropdown ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Add Instrument
              </label>
              <div className="flex gap-4">
                <ReactSelect
      className="w-full"
      name="instrument"
      isDisabled={loading}
      placeholder="Select Instrument"
      options={instrumentList.map((inst) => ({
        value: inst.id,
        label: `${inst.id} - ${inst.name}`, // 👈 id - name
      }))}
      value={
        instrumentList
          .filter((inst) => inst.id === selectedInstrument)
          .map((inst) => ({
            value: inst.id,
            label: `${inst.id} - ${inst.name}`,
          }))[0] || null
      }
      onChange={(selected) =>
        setSelectedInstrument(selected ? selected.value : null)
      }
    />

                <Button
                  type="button"
                  color="primary"
                  variant="filled"
                  className="px-2 py-1"
                  onClick={handleAddItem}
                  disabled={!selectedInstrument || loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                        ></path>
                      </svg>
                      Adding...
                    </div>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <Input
                    label="Name"
                    name="name"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.name && (
                    <span className="text-red-600 text-sm">Name is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Calibration Instrument Category
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded"
                    value={selectedInstrument || ""}
                    onChange={(e) => setSelectedInstrument(Number(e.target.value))}
                    disabled
                  >
                    <option value="">Select Instrument</option>
                    {instrumentList.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                  {formSubmitted && !selectedInstrument && (
                    <span className="text-red-600 text-sm">Instrument is required</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <Input
                    label="Make"
                    name="make"
                    placeholder="Enter make"
                    value={formData.make}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.make && (
                    <span className="text-red-600 text-sm">Make is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <Input
                    label="Model"
                    name="model"
                    placeholder="Enter model"
                    value={formData.model}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.model && (
                    <span className="text-red-600 text-sm">Model is required</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <Input
                    label="Serial No."
                    name="serialno"
                    placeholder="Enter serial no"
                    value={formData.serialno}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.serialno && (
                    <span className="text-red-600 text-sm">Serial No. is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <Input
                    label="ID No."
                    name="idno"
                    placeholder="Enter ID no"
                    value={formData.idno}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.idno && (
                    <span className="text-red-600 text-sm">ID No. is required</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <Input
                    label="Accuracy"
                    name="accuracy"
                    placeholder="Enter accuracy"
                    value={formData.accuracy}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.accuracy && (
                    <span className="text-red-600 text-sm">Accuracy is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <Input
                    label="Calibration Performed At"
                    name="location"
                    placeholder="Enter location"
                    value={calibLocation}
                    readOnly
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <Input
                    label="Calibration Validity"
                    name="calibrationvalidity"
                    placeholder="Enter validity"
                    value={formData.calibrationvalidity}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.calibrationvalidity && (
                    <span className="text-red-600 text-sm">Calibration Validity is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Calibration Method
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded"
                    name="sop"
                    value={formData.sop}
                    onChange={handleChange}
                    disabled={loading}
                  >
                   
                    {calibrationMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  {/* {formSubmitted && !formData.sop && (
                    <span className="text-red-600 text-sm">Calibration Method is required</span>
                  )} */}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Calibration Standard
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded bg-white focus:ring focus:ring-blue-200 cursor-pointer"
                    name="standard"
                    value={formData.standard}
                    onChange={handleStandardChange}
                    multiple
                    disabled={loading}
                  >
                    {calibrationStandards.map((standard) => (
                      <option key={standard.id} value={standard.id}>
                        {standard.name}
                      </option>
                    ))}
                  </select>
                  {/* {formSubmitted && formData.standard.length === 0 && (
                    <span className="text-red-600 text-sm">At least one Calibration Standard is required</span>
                  )} */}
                </div>
                <div className="w-1/2">
                  <Input
                    label="Letter Ref/Date"
                    name="letterref"
                    placeholder="Enter letter ref/date"
                    value={formData.letterref}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.letterref && (
                    <span className="text-red-600 text-sm">Letter Ref/Date is required</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <Input
                    label="Accessories"
                    name="accessories"
                    placeholder="Enter accessories"
                    value={formData.accessories}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.accessories && (
                    <span className="text-red-600 text-sm">Accessories is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Conformity Statement
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded"
                    name="conformitystatement"
                    value={formData.conformitystatement}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {formSubmitted && !formData.conformitystatement && (
                    <span className="text-red-600 text-sm">Conformity Statement is required</span>
                  )}
                </div>
              </div>

              {showDecisionRule && (
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Decision Rule
                    </label>
                    <Input
                      name="decisionrule"
                      placeholder="Enter decision rule"
                      value={formData.decisionrule}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {formSubmitted && showDecisionRule && !formData.decisionrule && (
                      <span className="text-red-600 text-sm">Decision Rule is required</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Remark
                  </label>
                  <textarea
                    className="w-full border border-gray-300 p-2 rounded"
                    name="remark"
                    placeholder="Enter remark"
                    value={formData.remark}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formSubmitted && !formData.remark && (
                    <span className="text-red-600 text-sm">Remark is required</span>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Condition of Item
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded"
                    name="conditiononrecieve"
                    value={formData.conditiononrecieve}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select condition</option>
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Un Satisfactory">Un Satisfactory</option>
                  </select>
                  {formSubmitted && !formData.conditiononrecieve && (
                    <span className="text-red-600 text-sm">Condition of Item is required</span>
                  )}
                </div>
              </div>

              <div className="w-1/2">
                <Input
                  label="Location"
                  name="newLocation"
                  placeholder="Enter new location"
                  value={formData.newLocation}
                  onChange={handleChange}
                  disabled={loading}
                />
                {formSubmitted && !formData.newLocation && (
                  <span className="text-red-600 text-sm">Location is required</span>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calibration Price Matrix
                </label>
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Select</th>
                      <th className="border px-2 py-1">Package Name</th>
                      <th className="border px-2 py-1">Desc</th>
                      <th className="border px-2 py-1">Rate</th>
                      <th className="border px-2 py-1">Accreditation</th>
                      <th className="border px-2 py-1">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceMatrices.length > 0 ? (
                      priceMatrices.map((matrix) => (
                        <tr key={matrix.id} className="hover:bg-gray-50">
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="radio"
                              name="pricematrixid"
                              value={matrix.id}
                              checked={formData.pricematrixid === matrix.id}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  pricematrixid: matrix.id,
                                }))
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="border px-2 py-1">{matrix.packagename}</td>
                          <td className="border px-2 py-1">{matrix.packagedesc}</td>
                          <td className="border px-2 py-1">{matrix.rate} ₹</td>
                          <td className="border px-2 py-1">{matrix.accreditation}</td>
                          <td className="border px-2 py-1">{matrix.location}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center p-2">
                          No Price Matrix Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {formSubmitted && !formData.pricematrixid && (
                  <span className="text-red-600 text-sm">Price Matrix is required</span>
                )}
              </div>

              <div className="flex space-x-4">
                <Button type="submit" color="primary" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                        ></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    "Save Item"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-white bg-red-600 hover:bg-red-700"
                  onClick={handleRemoveItem}
                  disabled={loading}
                >
                  Remove Item
                </Button>
              </div>
            </div>
          )}

          <hr className="my-4" />

          <h4 className="text-md font-semibold mb-2">Final Submission</h4>
          <div className="space-y-4">
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Subtotal</label>
              <div className="w-1/4">
                <Input
                  name="subtotal"
                  value={formData.subtotal}
                  onChange={handleChange}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Discount</label>
              <div className="w-1/12 m-2">
                <Input
                  type="number"
                  name="discnumber"
                  value={formData.discnumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="w-1/12 m-2">
                <select
                  className="w-full border border-gray-300 p-2 rounded"
                  name="disctype"
                  value={formData.disctype}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="₹">₹</option>
                  <option value="%">%</option>
                </select>
              </div>
              <div className="w-1/4">
                <Input
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Priority Testing Charges</label>
              <div className="w-1/12 m-2">
                <Input
                  type="number"
                  name="pchargesnumber"
                  value={formData.pchargesnumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="w-1/12 m-2">
                <select
                  className="w-full border border-gray-300 p-2 rounded"
                  name="pchargestype"
                  value={formData.pchargestype}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="₹">₹</option>
                  <option value="%">%</option>
                </select>
              </div>
              <div className="w-1/4">
                <Input
                  name="pcharges"
                  value={formData.pcharges}
                  onChange={handleChange}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Mobilization and Demobilization Charges</label>
              <div className="w-1/4 ">
                <Input
                  type="number"
                  name="mobilisation"
                  value={formData.mobilisation}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Witness Charges</label>
              <div className="w-1/4">
                <Input
                  type="number"
                  name="witnesscharges"
                  value={formData.witnesscharges}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">GST (SGST + CGST)</label>
              <div className="w-1/12 m-2">
                <Input
                  type="number"
                  name="gstnumber"
                  value={formData.gstnumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="w-1/12 m-2">
                <select
                  className="w-full border border-gray-300 p-2 rounded"
                  name="gsttype"
                  value={formData.gsttype}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="₹">₹</option>
                  <option value="%">%</option>
                </select>
              </div>
              <div className="w-1/4">
                <Input
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Freight Charges</label>
              <div className="w-1/4">
                <Input
                  name="freight"
                  type="number"
                  value={formData.freight}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">Total</label>
              <div className="w-1/4">
                <Input
                  name="total"
                  type="number"
                  value={formData.total}
                  onChange={handleChange}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end items-center">
              <label className="w-1/3 text-right pr-4">SAMPLE ENTRY BY</label>
              <div className="w-1/4">
                <Input
                  value={sampleEntryByData?.sample_entryby || ""}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="filled"
              className="text-white bg-green-600 hover:bg-green-700"
              onClick={handleSubmitInwardEntry}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                "Submit Inward Entry"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}