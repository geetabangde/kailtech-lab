import { useState, useEffect } from 'react';
import axios from 'utils/axios';
import { useParams, useNavigate } from 'react-router';
import { toast } from "sonner";
import { Input } from "components/ui";
import ReactSelect from "react-select";
import { ConfirmModal } from "components/shared/ConfirmModal";

const InstrumentMatrix = () => {
  const navigate = useNavigate();
  // State variables
  const [instrumentData, setInstrumentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('matrix');
  const [editFormData, setEditFormData] = useState({});
  const [priceMatrix, setPriceMatrix] = useState([]);
  const [addMatrixList, setAddMatrixList] = useState([]);
  const [matrixList, setMatrixList] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [modeList, setModeList] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetMatrixId, setTargetMatrixId] = useState(null);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const { id: inwardId, itemId: instId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  const handleBackToPerformCalibration = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const urlParams = {
    hakuna: '123', // inwardid
    matata: '456', // instid
    caliblocation: 'Lab',
    calibacc: 'Nabl'
  };

  const employeeId = 'emp123';

  const [matrixDetails, setMatrixDetails] = useState([]);
  const [errors, setErrors] = useState({});

  const loadDatalist = async () => {
    try {
      const apiUrl = `/calibrationprocess/getcrf_matrix-details?inward_id=${inwardId}&instid=${instId}&caliblocation=${caliblocation}&calibacc=${calibacc}`;
      const res = await axios.get(apiUrl);

      setPriceMatrix(res.data.price_matrix || []);
      setAddMatrixList(res.data.add_matrix_list || []);
      setMatrixList(res.data.matrix_list || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error?.response?.data?.message || 'Error fetching matrix data ❌');
      setLoading(false);
    }
  };

  useEffect(() => {
    const unitList = async () => {
      try {
        const res = await axios.get('/master/units-list');
        setUnits(res.data.data || []);
      } catch (error) {
        console.error('Error fetching units list:', error);
        toast.error(error?.response?.data?.message || 'Error fetching units list ❌');
      }
    };

    const fetchModeList = async () => {
      try {
        const res = await axios.get('/master/mode-list');
        setModeList(res.data.data || []);
      } catch (error) {
        console.error('Error fetching mode list:', error);
        toast.error(error?.response?.data?.message || 'Error fetching mode list ❌');
      }
    };

    const unitTypeList = async () => {
      try {
        const result = await axios.get('/master/unit-type-list');
        setUnitTypes(result.data.data || []);
      } catch (error) {
        console.error('Error fetching unit type list:', error);
        toast.error(error?.response?.data?.message || 'Error fetching unit type list ❌');
      }
    };

    fetchModeList();
    unitTypeList();
    unitList();
    loadDatalist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inwardId, instId, caliblocation, calibacc]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setInstrumentData({
          id: urlParams.matata,
          instid: 'inst789',
          allotedto: 'emp123',
          status: 1
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(error?.response?.data?.message || 'Error loading initial data ❌');
        setLoading(false);
      }
    };

    loadData();
  }, [urlParams.hakuna, urlParams.matata]);

  const validateForm = () => {
    const errors = {};

    if (!editFormData.matrixType?.trim()) {
      errors.matrixType = "Matrix Type is required.";
    }

    if (!editFormData.unittype) {
      errors.unittype = "Unit Type is required.";
    }

    if (!editFormData.unit) {
      errors.unit = "Unit is required.";
    }

    if (editFormData.instrangemin === "" || editFormData.instrangemin === null || editFormData.instrangemin === undefined) {
      errors.instrangemin = "Instrument range min is required.";
    }

    if (!editFormData.instrangemax) {
      errors.instrangemax = "Instrument range max is required.";
    }

    if (!editFormData.operangemin) {
      errors.operangemin = "Operating range min is required.";
    }

    if (!editFormData.operangemax) {
      errors.operangemax = "Operating range max is required.";
    }

    if (!editFormData.leastcount) {
      errors.leastcount = "Least-count is required.";
    }

    if (!editFormData.mode) {
      errors.mode = "Mode is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const editMatrix = async (matrixId) => {
    try {
      const response = await axios.get(`/calibrationprocess/get-edit-matrix-data`, {
        params: {
          inwardid: inwardId,
          instid: instId,
          matrixid: matrixId,
          caliblocation,
          calibacc
        }
      });

      const matrix = response.data.data.matrix_data;

      if (matrix) {
        setEditFormData({
          id: matrix.id,
          matrixType: matrix.matrixtype || '',
          unittype: matrix.unittype,
          unit: matrix.unit,
          unitName: matrix.calculationunit || '',
          instrangemin: matrix.instrangemin,
          instrangemax: matrix.instrangemax,
          operangemin: matrix.operangemin,
          operangemax: matrix.operangemax,
          mode: matrix.mode,
          leastcount: matrix.leastcount,
          pricematrixid: matrix.pricematrixid || ''
        });
        setCurrentView('editMatrix');
      } else {
        toast.error('No matrix data found ❌');
      }
    } catch (error) {
      console.error("Failed to fetch matrix data:", error);
      toast.error(error?.response?.data?.message || 'Failed to fetch matrix data ❌');
    }
  };

  const [inlinePoints, setInlinePoints] = useState({});

  const handleStartInlinePoint = (matrixId) => {
    setInlinePoints(prev => ({
      ...prev,
      [matrixId]: prev[matrixId] && prev[matrixId].length > 0 ? prev[matrixId] : ['']
    }));
  };

  const handleInlinePointChange = (matrixId, pointIndex, value) => {
    setInlinePoints(prev => {
      const arr = [...(prev[matrixId] || [''])];
      arr[pointIndex] = value;
      return { ...prev, [matrixId]: arr };
    });
  };

  const handleAddMoreInlinePoint = (matrixId) => {
    setInlinePoints(prev => ({
      ...prev,
      [matrixId]: [...(prev[matrixId] || []), '']
    }));
  };

  const handleRemoveInlinePoint = (matrixId, pointIndex) => {
    setInlinePoints(prev => {
      const arr = (prev[matrixId] || []).filter((_, i) => i !== pointIndex);
      if (arr.length === 0) {
        const next = { ...prev };
        delete next[matrixId];
        return next;
      }
      return { ...prev, [matrixId]: arr };
    });
  };

  const handleCancelInlinePoints = (matrixId) => {
    setInlinePoints(prev => {
      const next = { ...prev };
      delete next[matrixId];
      return next;
    });
  };

  const handleSaveInlinePoints = async (matrix) => {
    const rawPoints = inlinePoints[matrix.id] || [];
    const validPoints = rawPoints
      .map(p => (typeof p === 'string' ? p.trim() : String(p).trim()))
      .filter(p => p !== '' && p !== null && p !== undefined);

    if (validPoints.length === 0) {
      toast.error('Please enter at least one valid calibration point ❌');
      return;
    }

    const min = Number(matrix.instrangemin);
    const max = Number(matrix.instrangemax);

    if (!isNaN(min) && !isNaN(max)) {
      const invalidNumeric = validPoints.some(p => {
        const num = Number(p);
        return !isNaN(num) && (num < min || num > max);
      });
      if (invalidNumeric) {
        toast.error(`Calibration points must be within instrument range: ${min} to ${max} ❌`);
        return;
      }
    }

    await addCalibrationPoint(matrix.id, validPoints);
    handleCancelInlinePoints(matrix.id);
  };

  const addMatrixDetailFromRow = (item) => {
    let unitVal = item.unit || "";
    const matchedUnit = units.find(
      u => String(u.id) === String(item.unit) ||
           u.description === item.unit ||
           u.description === item.unit_text ||
           u.name === item.unit ||
           u.name === item.unit_text
    );
    if (matchedUnit) {
      unitVal = matchedUnit.id;
    }

    const priceMatrixIdVal =
      item.pricematrixid ||
      item.matrix_id ||
      item.id ||
      priceMatrix[0]?.pricematrixid ||
      priceMatrix[0]?.id ||
      1;

    setMatrixDetails(prev => [
      ...prev,
      {
        matrixType: "",
        unitType: item.unittype || "",
        unit: unitVal,
        unitText: item.unit_text || item.unit || "",
        instrumentRangeMin: item.instrangemin || "",
        instrumentRangeMax: item.instrangemax || "",
        operatingRangeMin: item.instrangemin || "",
        operatingRangeMax: item.instrangemax || "",
        leastCount: "",
        mode: item.mode || "Measure",
        pricematrixid: priceMatrixIdVal,
        calibPoints: []
      }
    ]);
  };

  const deleteMatrixDetail = (index) => {
    setMatrixDetails(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`unitType[${index}]`];
      delete newErrors[`unit[${index}]`];
      delete newErrors[`leastCount[${index}]`];
      delete newErrors[`instrumentRangeMin[${index}]`];
      delete newErrors[`instrumentRangeMax[${index}]`];
      delete newErrors[`operatingRangeMin[${index}]`];
      delete newErrors[`operatingRangeMax[${index}]`];
      return newErrors;
    });
  };

  const handleMatrixDetailChange = (index, field, value) => {
    const newDetails = [...matrixDetails];
    newDetails[index][field] = value;
    if (field === 'unit') {
      const selectedUnit = units.find(unit => String(unit.id) === String(value));
      newDetails[index].unitText = selectedUnit ? (selectedUnit.description || selectedUnit.name) : '';
    }
    setMatrixDetails(newDetails);
    setErrors(prev => ({ ...prev, [`${field}[${index}]`]: '' }));
  };

  const addCalibPoint = (matrixIndex) => {
    const newDetails = [...matrixDetails];
    newDetails[matrixIndex].calibPoints = [...(newDetails[matrixIndex].calibPoints || []), ''];
    setMatrixDetails(newDetails);
  };

  const removeCalibPoint = (matrixIndex, pointIndex) => {
    const newDetails = [...matrixDetails];
    newDetails[matrixIndex].calibPoints = newDetails[matrixIndex].calibPoints.filter((_, i) => i !== pointIndex);
    setMatrixDetails(newDetails);
  };

  const handleCalibPointChange = (matrixIndex, pointIndex, value) => {
    const newDetails = [...matrixDetails];
    newDetails[matrixIndex].calibPoints[pointIndex] = value;
    setMatrixDetails(newDetails);
  };

  const handleSaveMatrixDetails = async () => {
    if (matrixDetails.length === 0) {
      toast.error("Please add at least one matrix.");
      return;
    }

    const newErrors = {};
    matrixDetails.forEach((detail, index) => {
      if (!detail.unitType) newErrors[`unitType[${index}]`] = 'Unit Type is required';
      if (!detail.unit) newErrors[`unit[${index}]`] = 'Unit is required';
      if (!detail.leastCount) newErrors[`leastCount[${index}]`] = 'Least Count is required';
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all required fields in the Matrix Form.");
      return;
    }

    const calibPointsObj = {};
    matrixDetails.forEach((detail, index) => {
      calibPointsObj[`calibpoint${index + 1}`] = (detail.calibPoints || [])
        .map(p => (typeof p === 'string' ? p.trim() : String(p).trim()))
        .filter(p => p !== '' && p !== null && p !== undefined);
    });

    const pMatrixId = Number(
      matrixDetails[0]?.pricematrixid ||
      priceMatrix[0]?.pricematrixid ||
      priceMatrix[0]?.id ||
      1
    );

    const payload = {
      id: Number(instId),
      inwardid: Number(inwardId),
      instid: Number(instId),
      caliblocation,
      calibacc,
      pricematrixid: pMatrixId,
      matrixno: matrixDetails.map((_, i) => i + 1),
      matrixtype: matrixDetails.map(d => d.matrixType || 'General'),
      unittype: matrixDetails.map(d => d.unitType || ''),
      unit: matrixDetails.map(d => {
        const uNum = Number(d.unit);
        if (!isNaN(uNum) && uNum > 0) return uNum;
        const matched = units.find(
          u => u.description === d.unit || u.name === d.unit || String(u.id) === String(d.unit)
        );
        return matched ? Number(matched.id) : 1;
      }),
      defaultrangemin: matrixDetails.map(d => d.instrumentRangeMin || '0'),
      defaultrangemax: matrixDetails.map(d => d.instrumentRangeMax || '0'),
      instrangemin: matrixDetails.map(d => d.instrumentRangeMin || '0'),
      instrangemax: matrixDetails.map(d => d.instrumentRangeMax || '0'),
      operangemin: matrixDetails.map(d => d.operatingRangeMin || d.instrumentRangeMin || '0'),
      operangemax: matrixDetails.map(d => d.operatingRangeMax || d.instrumentRangeMax || '0'),
      leastcount: matrixDetails.map(d => d.leastCount || '0'),
      mode: matrixDetails.map(d => String(d.mode || 'Measure')),
      matrixid: matrixDetails.map((_, i) => String(i + 1)),
      ...calibPointsObj
    };

    try {
      const response = await axios.post('/calibrationprocess/add-insert-inward-matrix', payload);
      toast.success(response?.data?.message || 'Matrix saved successfully ✅');
      setMatrixDetails([]);
      loadDatalist();
    } catch (error) {
      console.error("Error saving matrix:", error);
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        const errorList = Object.entries(validationErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        toast.error(`Validation error: ${errorList} ❌`);
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save matrix ❌');
      }
    }
  };

  const addCalibrationPoint = async (matrixId, points) => {
    const validPoints = points
      .map(p => (typeof p === 'string' ? p.trim() : String(p).trim()))
      .filter(p => p !== '' && p !== null && p !== undefined);
    const actualMatrixId = matrixId.id || matrixId;

    const payload = {
      inwardid: inwardId,
      id: instId,
      matrixid: parseInt(actualMatrixId, 10),
      caliblocation,
      calibacc,
      calibpoint: validPoints
    };

    try {
      const response = await axios.post('/calibrationprocess/create-calibration-points', payload);
      setMatrixList(prev =>
        prev.map(matrix =>
          matrix.id === actualMatrixId
            ? {
              ...matrix,
              calibration_points: [
                ...(matrix.calibration_points || []),
                ...validPoints.map((point, index) => ({
                  id: `cp${Date.now() + index}`,
                  unittype: matrix.unittype,
                  mode: matrix.mode,
                  unit: matrix.unit,
                  point: point.toString()
                }))
              ]
            }
            : matrix
        )
      );
      toast.success(response?.data?.message || 'Calibration points added successfully ✅');
      setCurrentView('matrix');
    } catch (error) {
      console.error('Error adding calibration points:', error);
      toast.error(error?.response?.data?.message || 'Error adding calibration points ❌');
    }
  };

  const handleDeleteMatrixClick = (matrixId) => {
    setTargetMatrixId(matrixId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteMatrix = async () => {
    if (!targetMatrixId) return;
    setConfirmDeleteLoading(true);
    try {
      const response = await axios.delete(`/calibrationprocess/delete-matrix/${targetMatrixId}/${inwardId}`);
      setMatrixList(prev => prev.filter(m => m.id !== targetMatrixId));
      toast.success(response?.data?.message || 'Matrix deleted successfully ✅');
      setDeleteModalOpen(false);
      setTargetMatrixId(null);
    } catch (error) {
      console.error('Error deleting matrix:', error);
      toast.error(error?.response?.data?.message || 'Error deleting matrix ❌');
    } finally {
      setConfirmDeleteLoading(false);
    }
  };

  const deleteCalibrationPoint = async (matrixId, pointId) => {
    try {
      await axios.delete(`/calibrationprocess/delete-calibration-point/${pointId}/${inwardId}`);
      setMatrixList(prev =>
        prev.map(matrix =>
          matrix.id === matrixId
            ? {
              ...matrix,
              calibration_points: matrix.calibration_points.filter(p => p.id !== pointId),
            }
            : matrix
        )
      );
      toast.success('Calibration point deleted ✅');
    } catch (error) {
      toast.error('Failed to delete calibration point ❌');
      console.error(error);
    }
  };



  const saveEditedMatrix = async () => {
    if (!validateForm()) return;

    const payload = {
      inwardid: inwardId,
      instid: instId,
      id: parseInt(editFormData.id),
      caliblocation,
      calibacc,
      mode: editFormData.mode,
      unittype: editFormData.unittype,
      unit: editFormData.unit,
      operangemin: editFormData.operangemin,
      operangemax: editFormData.operangemax,
      instrangemin: editFormData.instrangemin,
      instrangemax: editFormData.instrangemax,
      leastcount: editFormData.leastcount,
      matrixtype: editFormData.matrixType,
      pricematrixid: editFormData.pricematrixid
    };

    try {
      const response = await axios.post('/calibrationprocess/updateMatrix', payload);
      setMatrixList(prev =>
        prev.map(matrix =>
          matrix.id === editFormData.id
            ? {
              ...matrix,
              unittype: editFormData.unittype,
              unit: editFormData.unit,
              instrangemin: editFormData.instrangemin,
              instrangemax: editFormData.instrangemax,
              operangemin: editFormData.operangemin,
              operangemax: editFormData.operangemax,
              mode: editFormData.mode,
              leastcount: editFormData.leastcount,
              matrixtype: editFormData.matrixType,
              pricematrixid: editFormData.pricematrixid
            }
            : matrix
        )
      );
      toast.success(response?.data?.message || 'Matrix updated successfully ✅');
      setCurrentView('matrix');
    } catch (error) {
      console.error('Error updating matrix:', error);
      toast.error(error?.response?.data?.message || 'Failed to update matrix ❌');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const canEdit = employeeId === instrumentData.allotedto &&
    (instrumentData.status === 0 || instrumentData.status === 1);

  if (currentView === 'editMatrix') {
    return (
      <MatrixForm
        isAdd={false}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        formErrors={formErrors}
        unitTypes={unitTypes}
        units={units}
        modeList={modeList}
        onBack={() => setCurrentView('matrix')}
        onSave={saveEditedMatrix}
      />
    );
  }



  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Price Matrix</h3>
          <button
            type="button"
            onClick={handleBackToPerformCalibration}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            &lt;&lt; Back to Perform Calibration
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Sr no</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Package Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Package Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Accreditation</th>
                </tr>
              </thead>
              <tbody>
                {priceMatrix.length > 0 ? (
                  priceMatrix.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.packagename}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.packagedesc}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.accreditation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-2">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {canEdit && (
            <div className="mt-6 border border-gray-300 p-4 rounded">
              <div className="grid grid-cols-5 gap-4 mb-4 font-semibold">
                <div>Unit Type</div>
                <div>Unit</div>
                <div>Range</div>
                <div>Mode</div>
                <div>Add</div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  {addMatrixList.length > 0 ? (
                    addMatrixList.map((item, index) => (
                      <div
                        key={item.matrix_id || index}
                        className="grid grid-cols-5 gap-4 items-center border-b border-gray-200 py-2"
                      >
                        <div>{item.unittype}</div>
                        <div>
                          {item.unit_text || item.unit}
                        </div>
                        <div>
                          {item.instrangemin} to {item.instrangemax}
                        </div>
                        <div>{item.mode || "-"}</div>
                        <div>
                          <button
                            type="button"
                            onClick={() => addMatrixDetailFromRow(item)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded text-sm transition-colors"
                          >
                            Add Matrix
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No Matrix Data Found</div>
                  )}
                </div>
              </div>

              {/* Matrix Forms List */}
              {matrixDetails.length > 0 && (
                <div className="mt-6 space-y-6">
                  {matrixDetails.map((detail, index) => (
                    <div key={index} className="border border-gray-300 rounded p-4 bg-white">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Matrix Type (Optional)</label>
                            <div className="col-span-2">
                              <input
                                type="text"
                                name={`matrixtype[${index}]`}
                                value={detail.matrixType}
                                onChange={(e) => handleMatrixDetailChange(index, 'matrixType', e.target.value)}
                                placeholder="e.g., Voltage, Current"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Instrument Range Min</label>
                            <div className="col-span-2">
                              <input
                                type="number"
                                name={`instrangemin[${index}]`}
                                value={detail.instrumentRangeMin}
                                onChange={(e) => handleMatrixDetailChange(index, 'instrumentRangeMin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                              {errors[`instrumentRangeMin[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`instrumentRangeMin[${index}]`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Operating Range Min</label>
                            <div className="col-span-2">
                              <input
                                type="number"
                                name={`operangemin[${index}]`}
                                value={detail.operatingRangeMin}
                                onChange={(e) => handleMatrixDetailChange(index, 'operatingRangeMin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                              {errors[`operatingRangeMin[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`operatingRangeMin[${index}]`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Least Count</label>
                            <div className="col-span-2">
                              <input
                                type="text"
                                name={`leastcount[${index}]`}
                                value={detail.leastCount}
                                onChange={(e) => handleMatrixDetailChange(index, 'leastCount', e.target.value)}
                                placeholder="Least Count"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                              {errors[`leastCount[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`leastCount[${index}]`]}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Unit Type/Parameter</label>
                            <div className="col-span-2">
                              <select
                                name={`unittype[${index}]`}
                                value={detail.unitType}
                                onChange={(e) => handleMatrixDetailChange(index, 'unitType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                              >
                                <option value="">Select Unit Type / Parameter</option>
                                {unitTypes.map(type => (
                                  <option key={type.id || type.name} value={type.name}>{type.name}</option>
                                ))}
                              </select>
                              {errors[`unitType[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`unitType[${index}]`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Unit</label>
                            <div className="col-span-2">
                              <select
                                name={`unit[${index}]`}
                                value={detail.unit}
                                onChange={(e) => handleMatrixDetailChange(index, 'unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                              >
                                <option value="">Select Unit</option>
                                {units.map(unit => (
                                  <option key={unit.id} value={unit.id}>{unit.description || unit.name}</option>
                                ))}
                              </select>
                              {errors[`unit[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`unit[${index}]`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Instrument Range Max</label>
                            <div className="col-span-2">
                              <input
                                type="number"
                                name={`instrangemax[${index}]`}
                                value={detail.instrumentRangeMax}
                                onChange={(e) => handleMatrixDetailChange(index, 'instrumentRangeMax', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                              {errors[`instrumentRangeMax[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`instrumentRangeMax[${index}]`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Operating Range Max</label>
                            <div className="col-span-2">
                              <input
                                type="number"
                                name={`operangemax[${index}]`}
                                value={detail.operatingRangeMax}
                                onChange={(e) => handleMatrixDetailChange(index, 'operatingRangeMax', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                              {errors[`operatingRangeMax[${index}]`] && (
                                <p className="mt-1 text-sm text-red-500">{errors[`operatingRangeMax[${index}]`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-sm text-gray-700">Mode</label>
                            <div className="col-span-2">
                              <input
                                type="text"
                                name={`mode[${index}]`}
                                value={detail.mode}
                                onChange={(e) => handleMatrixDetailChange(index, 'mode', e.target.value)}
                                placeholder="Mode"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calibration points section */}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => addCalibPoint(index)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          + Add Calibration Point
                        </button>

                        <div className="mt-2 space-y-2">
                          {(detail.calibPoints || []).map((value, pointIndex) => {
                            const isInvalid = Boolean(
                              value &&
                              !isNaN(Number(value)) &&
                              Number(detail.instrumentRangeMax) &&
                              Number(value) > Number(detail.instrumentRangeMax)
                            );
                            return (
                              <div key={pointIndex} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={value || ""}
                                    onChange={(e) => handleCalibPointChange(index, pointIndex, e.target.value)}
                                    className={`w-full px-3 py-2 border ${
                                      isInvalid ? "border-red-500" : "border-gray-300"
                                    } rounded text-sm`}
                                    placeholder={`Calibration Point ${pointIndex + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeCalibPoint(index, pointIndex)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                                {isInvalid && (
                                  <p className="text-sm text-red-500">
                                    Calibration point cannot be greater than Instrument Range Max ({detail.instrumentRangeMax})
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => deleteMatrixDetail(matrixDetails.length - 1)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Delete Matrix
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMatrixDetails}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Save Matrix
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Matrix</h3>
        </div>
        <div className="p-6">
          {matrixList.length > 0 ? (
            <div className="space-y-6">
              {matrixList.map((item, index) => (
                <div key={item.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Sr no</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Matrix type</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Parameter</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Mode</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Unit</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Instrument Range</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Operating Range</th>
                          <th className="border-r border-gray-300 px-4 py-2 text-left">Least count</th>
                          <th className="px-4 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50 border-b border-gray-300">
                          <td className="border-r border-gray-300 px-4 py-2">{index + 1}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.matrixtype}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.unittype}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.mode}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.unit}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.instrangemin} to {item.instrangemax}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.operangemin} to {item.operangemax}</td>
                          <td className="border-r border-gray-300 px-4 py-2">{item.leastcount}</td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2 flex-wrap">
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => editMatrix(item.id)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleStartInlinePoint(item.id)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Add Calibration Point
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMatrixClick(item.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="9" className="p-0">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-blue-50 border-b border-gray-300">
                                  <th className="border-r border-gray-300 px-4 py-2 text-left">Sr no</th>
                                  <th className="border-r border-gray-300 px-4 py-2 text-left">Parameter</th>
                                  <th className="border-r border-gray-300 px-4 py-2 text-left">Mode</th>
                                  <th className="border-r border-gray-300 px-4 py-2 text-left">Unit</th>
                                  <th className="border-r border-gray-300 px-4 py-2 text-left">Point</th>
                                  <th className="px-4 py-2 text-left">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(item.calibration_points || []).map((point, pointIndex) => (
                                  <tr key={point.id || pointIndex} className="hover:bg-blue-25 border-b border-gray-200 last:border-b-0">
                                    <td className="border-r border-gray-200 px-4 py-2">{pointIndex + 1}</td>
                                    <td className="border-r border-gray-200 px-4 py-2">{item.unittype}</td>
                                    <td className="border-r border-gray-200 px-4 py-2">{item.mode}</td>
                                    <td className="border-r border-gray-200 px-4 py-2">{item.unit}</td>
                                    <td className="border-r border-gray-200 px-4 py-2">{point.point}</td>
                                    <td className="px-4 py-2">
                                      {canEdit && (
                                        <button
                                          onClick={() => deleteCalibrationPoint(item.id, point.id)}
                                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}

                                {/* Inline Add Calibration Point Rows */}
                                {inlinePoints[item.id] &&
                                  inlinePoints[item.id].map((ptVal, ptIdx) => (
                                    <tr key={`new_pt_${ptIdx}`} className="bg-blue-50/70 border-b border-blue-200">
                                      <td className="border-r border-blue-200 px-4 py-2 text-blue-700 font-semibold text-sm">
                                        {(item.calibration_points?.length || 0) + ptIdx + 1}
                                      </td>
                                      <td className="border-r border-blue-200 px-4 py-2 text-sm text-gray-700">{item.unittype}</td>
                                      <td className="border-r border-blue-200 px-4 py-2 text-sm text-gray-700">{item.mode}</td>
                                      <td className="border-r border-blue-200 px-4 py-2 text-sm text-gray-700">{item.unit}</td>
                                      <td className="border-r border-blue-200 px-4 py-2">
                                        <input
                                          type="text"
                                          value={ptVal}
                                          onChange={(e) => handleInlinePointChange(item.id, ptIdx, e.target.value)}
                                          placeholder={`Range: ${item.instrangemin} - ${item.instrangemax}`}
                                          className="w-48 px-2 py-1 border border-blue-400 rounded text-sm bg-white focus:outline-blue-500"
                                          autoFocus={ptIdx === inlinePoints[item.id].length - 1}
                                        />
                                      </td>
                                      <td className="px-4 py-2">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveInlinePoint(item.id, ptIdx)}
                                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  ))}

                                {inlinePoints[item.id] && (
                                  <tr className="bg-blue-50/30 border-b border-gray-200">
                                    <td colSpan="6" className="px-4 py-2">
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => handleAddMoreInlinePoint(item.id)}
                                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                                        >
                                          + Add Another Point
                                        </button>
                                        <div className="flex-1" />
                                        <button
                                          type="button"
                                          onClick={() => handleCancelInlinePoints(item.id)}
                                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs transition-colors font-medium"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveInlinePoints(item)}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors shadow-xs"
                                        >
                                          Save Point(s)
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {(!item.calibration_points || item.calibration_points.length === 0) &&
                                  !inlinePoints[item.id] && (
                                    <tr>
                                      <td
                                        colSpan="6"
                                        className="px-4 py-2 text-center text-gray-500"
                                      >
                                        No calibration points added
                                      </td>
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-gray-300 px-4 py-6 text-center text-gray-500 rounded-lg">
              No matrix data available
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        show={deleteModalOpen}
        onClose={() => {
          if (!confirmDeleteLoading) {
            setDeleteModalOpen(false);
            setTargetMatrixId(null);
          }
        }}
        onOk={handleConfirmDeleteMatrix}
        confirmLoading={confirmDeleteLoading}
        state="pending"
        messages={{
          pending: {
            title: "Delete Matrix?",
            description:
              "Are you sure you want to delete this matrix? All associated calibration points will also be removed.",
            actionText: "Delete",
          },
        }}
      />
    </div>
  );
};



const MatrixForm = ({
  isAdd = false,
  editFormData,
  setEditFormData,
  formErrors,
  unitTypes,
  units,
  modeList,
  onBack,
  onSave,
}) => {
  return (
    <div className="min-h-screen bg-gray-50" style={{ background: "white", margin: "10px" }}>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{isAdd ? 'Add Matrix Form' : 'Edit Matrix Form'}</h2>
          <button
            onClick={onBack}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            &lt;&lt; Back to Matrix List
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 mb-2">
                <Input
                  label="Matrix Type (Optional)"
                  name="matrixType"
                  value={editFormData.matrixType || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      matrixType: e.target.value,
                    }))
                  }
                />
                {formErrors.matrixType && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.matrixType}</p>
                )}
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <ReactSelect
                  name="unittype"
                  options={unitTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  value={
                    unitTypes
                      .map((type) => ({
                        value: type.id,
                        label: type.name,
                      }))
                      .find((opt) => String(opt.value) === String(editFormData.unittype) || opt.label === editFormData.unittype) || null
                  }
                  onChange={(selected) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      unittype: selected?.value || "",
                    }))
                  }
                  placeholder="Select Unit Type / Parameter"
                />
                {formErrors.unittype && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.unittype}</p>
                )}
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <ReactSelect
                  name="unit"
                  options={units.map((unit) => ({
                    value: unit.id,
                    label: `${unit.name} (${unit.description})`,
                  }))}
                  value={
                    units
                      .map((unit) => ({
                        value: unit.id,
                        label: `${unit.name} (${unit.description})`,
                      }))
                      .find((opt) => String(opt.value) === String(editFormData.unit)) || null
                  }
                  onChange={(selected) => {
                    const selectedUnit = units.find(
                      (unit) => unit.id === selected?.value
                    );
                    setEditFormData((prev) => ({
                      ...prev,
                      unit: selected?.value || "",
                      unitName: selectedUnit ? selectedUnit.description : "",
                    }));
                  }}
                  placeholder="Select Unit"
                />
                {formErrors.unit && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.unit}</p>
                )}
              </div>
              <div className="mb-2">
                <Input
                  type="number"
                  label="Instrument range min"
                  name="instrangemin"
                  value={editFormData.instrangemin !== undefined && editFormData.instrangemin !== null ? editFormData.instrangemin : ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      instrangemin: e.target.value,
                    }))
                  }
                />
                {formErrors.instrangemin && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.instrangemin}</p>
                )}
              </div>
              <div className="mb-2">
                <Input
                  type="number"
                  label="Instrument range max"
                  name="instrangemax"
                  value={editFormData.instrangemax !== undefined && editFormData.instrangemax !== null ? editFormData.instrangemax : ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      instrangemax: e.target.value,
                    }))
                  }
                />
                {formErrors.instrangemax && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.instrangemax}</p>
                )}
              </div>
              <div className="mb-2">
                <Input
                  type="number"
                  label="Operating range min"
                  name="operangemin"
                  value={editFormData.operangemin !== undefined && editFormData.operangemin !== null ? editFormData.operangemin : ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      operangemin: e.target.value,
                    }))
                  }
                />
                {formErrors.operangemin && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.operangemin}</p>
                )}
              </div>
              <div className="mb-2">
                <Input
                  type="number"
                  label="Operating range max"
                  name="operangemax"
                  value={editFormData.operangemax !== undefined && editFormData.operangemax !== null ? editFormData.operangemax : ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      operangemax: e.target.value,
                    }))
                  }
                />
                {formErrors.operangemax && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.operangemax}</p>
                )}
              </div>
              <div className="mb-2">
                <Input
                  type="number"
                  step="0.001"
                  label="Least Count"
                  name="leastcount"
                  value={editFormData.leastcount !== undefined && editFormData.leastcount !== null ? editFormData.leastcount : ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      leastcount: e.target.value,
                    }))
                  }
                />
                {formErrors.leastcount && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.leastcount}</p>
                )}
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <ReactSelect
                  name="mode"
                  options={modeList.map((mode) => ({
                    value: mode.id,
                    label: mode.name,
                  }))}
                  value={
                    modeList
                      .map((mode) => ({
                        value: mode.id,
                        label: mode.name,
                      }))
                      .find((opt) => String(opt.value) === String(editFormData.mode) || opt.label?.toLowerCase() === String(editFormData.mode).toLowerCase()) || null
                  }
                  onChange={(selected) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      mode: selected?.value || "",
                    }))
                  }
                  placeholder="Select Mode"
                />
                {formErrors.mode && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.mode}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onSave}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded text-base font-medium transition-colors"
              >
                Save Matrix
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstrumentMatrix;