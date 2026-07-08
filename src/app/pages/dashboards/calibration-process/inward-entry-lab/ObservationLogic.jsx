import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axios';
import { toast } from 'sonner';
import { JWT_HOST_API } from "configs/auth.config";

export const useObservationLogic = ({
  observationTemplate,
  instId,
  inwardId,
  dynamicHeadings,
  selectedTableData,
  tableInputValues,
  setTableInputValues,
  setObservationErrors,
  leastCountData
}) => {
  const [observations, setObservations] = useState([]);
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });

  const safeGetValue = (item) => {
    if (!item) return '';
    if (typeof item === 'object' && item !== null) {
      return item.value !== null && item.value !== undefined ? item.value : '';
    }
    return item.toString();
  };

  // Calculate row values based on dynamic settings
  const calculateRowValues = useCallback((rowData) => {
    const parsedValues = rowData.map((val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });

    const result = { average: '', error: '', repeatability: '', hysteresis: '' };

    if (!dynamicHeadings?.mainhading?.calibration_settings) {
      return result;
    }

    const sortedSettings = [...dynamicHeadings.mainhading.calibration_settings]
      .filter(col => col.checkbox === 'yes')
      .sort((a, b) => a.field_position - b.field_position);

    let obsStartIndex = 1;
    let masterValueIndex = -1;

    sortedSettings.forEach((setting, idx) => {
      if (setting.fieldname === 'master' || setting.fieldname.includes('observation')) {
        obsStartIndex = idx + 1;
      } else if (setting.fieldname === 'calculatedmaster' || setting.fieldname === 'uuc') {
        masterValueIndex = idx + 1;
      }
    });

    const obsSettings = dynamicHeadings?.observation_heading?.observation_settings || [];
    const obsCount = obsSettings.filter(obs => obs.checkbox === 'yes').length;

    const observations = [];
    for (let i = 0; i < obsCount; i++) {
      observations.push(parsedValues[obsStartIndex + i]);
    }

    const validReadings = observations.filter((val) => val !== 0);

    result.average = validReadings.length
      ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(3)
      : '';

    if (masterValueIndex > 0 && result.average) {
      const masterValue = parsedValues[masterValueIndex];
      result.error = (masterValue - parseFloat(result.average)).toFixed(3);
    }

    result.repeatability = validReadings.length
      ? ((Math.max(...validReadings) - Math.min(...validReadings)) / 2).toFixed(3)
      : '';

    result.hysteresis = validReadings.length
      ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(3)
      : '';

    return result;
  }, [dynamicHeadings]);

  // Create observation rows dynamically
  const createObservationRows = useCallback((observationData) => {
    if (!observationData || !dynamicHeadings?.mainhading?.calibration_settings) {
      return {
        rows: [],
        hiddenInputs: { calibrationPoints: [], types: [], repeatables: [], values: [] },
      };
    }

    const sortedSettings = [...dynamicHeadings.mainhading.calibration_settings]
      .filter(col => col.checkbox === 'yes')
      .sort((a, b) => a.field_position - b.field_position);

    const rows = [];
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    observationData.forEach((point) => {
      const row = [point.sequence_number?.toString() || point.sr_no?.toString() || ''];

      sortedSettings.forEach((setting) => {
        const fieldname = setting.fieldname;

        if (fieldname === 'uuc') {
          row.push(safeGetValue(point.set_pressure?.uuc_value || point.uuc_value));
        } else if (fieldname === 'calculatedmaster') {
          row.push(safeGetValue(point.set_pressure?.converted_value || point.converted_uuc_value));
        } else if (fieldname === 'master' || fieldname.includes('observation')) {
          const obsSettings = dynamicHeadings?.observation_heading?.observation_settings || [];
          const obsCount = obsSettings.filter(obs => obs.checkbox === 'yes').length;

          for (let i = 1; i <= obsCount; i++) {
            row.push(safeGetValue(point.observations?.[`master_${i}`] || point[`m${i}`]));
          }
        } else if (fieldname === 'averagemaster') {
          row.push(safeGetValue(point.calculations?.mean || point.average_master));
        } else if (fieldname === 'error') {
          row.push(safeGetValue(point.calculations?.error));
        } else if (fieldname === 'hysterisis') {
          row.push(safeGetValue(point.calculations?.hysteresis || point.hysterisis));
        }
      });

      rows.push(row);
      calibrationPoints.push(point.point_id?.toString() || '');
      types.push('master');
      repeatables.push('0');
      values.push(safeGetValue(point.set_pressure?.uuc_value) || '0');
    });

    return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
  }, [dynamicHeadings]);

  // Fetch observations
  const fetchObservations = useCallback(async () => {
    if (!observationTemplate) return;

    try {
      const response = await axios.post(
        'https://kailtech.in/newlims/api/ob/get-observation',
        {
          fn: observationTemplate,
          instid: instId,
          inwardid: inwardId,
        }
      );

      const isSuccess = response.data.status === true || response.data.staus === true;

      if (isSuccess && response.data.data) {
        const observationData = response.data.data;
        console.log('📊 Observation Data:', observationData);

        // Handle thermal coefficients
        if (observationData.thermal_coeff || observationData.thermal_coefficients) {
          const thermalData = observationData.thermal_coeff || observationData.thermal_coefficients;
          setThermalCoeff({
            uuc: thermalData.uuc || thermalData.uuc_coefficient || '',
            master: thermalData.master || thermalData.master_coefficient || '',
            thickness_of_graduation: thermalData.thickness_of_graduation || '',
          });
        }

        // Extract calibration points
        let calibrationPoints = [];
        if (observationData.calibration_points) {
          calibrationPoints = observationData.calibration_points;
        } else if (observationData.data?.calibration_points) {
          calibrationPoints = observationData.data.calibration_points;
        } else if (observationData.observations) {
          calibrationPoints = observationData.observations;
        } else if (Array.isArray(observationData)) {
          calibrationPoints = observationData;
        }

        setObservations(calibrationPoints);
      } else {
        setObservations([]);
      }
    } catch (error) {
      console.log('Error fetching observations:', error);
      setObservations([]);
    }
  }, [observationTemplate, instId, inwardId]);

  // Refetch observations
  const refetchObservations = useCallback(async () => {
    await fetchObservations();
  }, [fetchObservations]);

  // Build observation payloads
  const buildObservationPayloads = useCallback((rowIndex, rowData, calibrationPointId) => {
    const calculated = calculateRowValues(rowData);
    const payloads = [];

    if (!dynamicHeadings?.mainhading?.calibration_settings) {
      return payloads;
    }

    const sortedSettings = [...dynamicHeadings.mainhading.calibration_settings]
      .filter(col => col.checkbox === 'yes')
      .sort((a, b) => a.field_position - b.field_position);

    let currentCol = 1;

    sortedSettings.forEach((setting) => {
      const fieldname = setting.fieldname;

      if (fieldname === 'uuc') {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: '0',
          value: rowData[currentCol] || '0',
        });
        currentCol++;
      } else if (fieldname === 'calculatedmaster') {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'calculatedmaster',
          repeatable: '0',
          value: rowData[currentCol] || '0',
        });
        currentCol++;
      } else if (fieldname === 'master' || fieldname.includes('observation')) {
        const obsCount = dynamicHeadings?.observation_heading?.observation_settings?.filter(obs => obs.checkbox === 'yes').length || 3;

        for (let i = 0; i < obsCount; i++) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'master',
            repeatable: i.toString(),
            value: rowData[currentCol] || '0',
          });
          currentCol++;
        }

        // Add calculated values
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
          repeatable: '0',
          value: calculated.average || '0',
        });
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'error',
          repeatable: '0',
          value: calculated.error || '0',
        });
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'hysterisis',
          repeatable: '0',
          value: calculated.hysteresis || '0',
        });
      } else {
        currentCol++;
      }
    });

    return payloads;
  }, [dynamicHeadings, instId, inwardId, calculateRowValues]);

  // Handle input change with validation
  const handleInputChange = useCallback((rowIndex, colIndex, value) => {
    setTableInputValues((prev) => {
      const newValues = { ...prev };
      const key = `${rowIndex}-${colIndex}`;
      newValues[key] = value;

      // Real-time validation for least count
      const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex];
      const leastCount = leastCountData[calibPointId];

      if (leastCount && value.trim()) {
        const numValue = parseFloat(value);

        setObservationErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[key];
          return newErrors;
        });

        if (numValue < leastCount) {
          setObservationErrors(prevErrors => ({
            ...prevErrors,
            [key]: `Please enter a value within leastcount ${leastCount}`
          }));
        } else if (numValue % leastCount !== 0) {
          setObservationErrors(prevErrors => ({
            ...prevErrors,
            [key]: `Please enter value divisible by ${leastCount}`
          }));
        }
      }

      // Calculate and update dependent fields
      const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return newValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData);

      // Update calculated columns based on dynamic settings
      if (dynamicHeadings?.mainhading?.calibration_settings) {
        const sortedSettings = [...dynamicHeadings.mainhading.calibration_settings]
          .filter(col => col.checkbox === 'yes')
          .sort((a, b) => a.field_position - b.field_position);

        let currentCol = 1;
        sortedSettings.forEach((setting) => {
          if (setting.fieldname === 'master' || setting.fieldname.includes('observation')) {
            const obsCount = dynamicHeadings?.observation_heading?.observation_settings?.filter(obs => obs.checkbox === 'yes').length || 3;
            currentCol += obsCount;
          } else if (setting.fieldname === 'averagemaster') {
            newValues[`${rowIndex}-${currentCol}`] = calculated.average;
            currentCol++;
          } else if (setting.fieldname === 'error') {
            newValues[`${rowIndex}-${currentCol}`] = calculated.error;
            currentCol++;
          } else if (setting.fieldname === 'hysterisis') {
            newValues[`${rowIndex}-${currentCol}`] = calculated.hysteresis;
            currentCol++;
          } else {
            currentCol++;
          }
        });
      }

      return newValues;
    });
  }, [selectedTableData, leastCountData, dynamicHeadings, calculateRowValues, setTableInputValues, setObservationErrors]);

  // Handle observation blur (auto-save)
  const handleObservationBlur = useCallback(async (rowIndex) => {
    const token = localStorage.getItem('authToken');
    const hiddenInputs = selectedTableData?.hiddenInputs || {
      calibrationPoints: [],
      types: [],
      repeatables: [],
      values: [],
    };

    const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];
    if (!calibrationPointId) {
      toast.error('Calibration point ID not found');
      return;
    }

    const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
      const inputKey = `${rowIndex}-${idx}`;
      return tableInputValues[inputKey] ?? (cell?.toString() || '');
    });

    const payloads = buildObservationPayloads(rowIndex, rowData, calibrationPointId);

    try {
      for (const payload of payloads) {
        await axios.post(
          `${JWT_HOST_API}/calibrationprocess/set-observations`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      toast.success('Observation saved successfully!');
      await refetchObservations();
    } catch (err) {
      console.error('Error saving observation:', err);
      toast.error(err.response?.data?.message || 'Failed to save observation');
    }
  }, [selectedTableData, tableInputValues, buildObservationPayloads, refetchObservations]);

  // Handle row save
  const handleRowSave = useCallback(async (rowIndex) => {
    await handleObservationBlur(rowIndex);
  }, [handleObservationBlur]);

  // Handle thermal coefficient blur
  const handleThermalCoeffBlur = useCallback(async (type, value) => {
    const token = localStorage.getItem('authToken');
    const calibrationPointId = instId;

    if (!calibrationPointId) {
      toast.error('Instrument ID not found for thermal coefficient');
      return;
    }

    const payload = {
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: calibrationPointId,
      type: type,
      repeatable: '0',
      value: value || '0',
    };

    try {
      await axios.post(
        `${JWT_HOST_API}/calibrationprocess/set-observations`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Thermal coefficient saved successfully!');

    } catch (err) {
      console.error('Error saving thermal coefficient:', err);
      toast.error(err.response?.data?.message || 'Failed to save thermal coefficient');
    }
  }, [instId, inwardId]);

  // Validate observation fields
  const validateObservationFields = useCallback(() => {
    let newErrors = {};

    if (!dynamicHeadings?.mainhading?.calibration_settings) {
      return true;
    }

    const sortedSettings = [...dynamicHeadings.mainhading.calibration_settings]
      .filter(col => col.checkbox === 'yes')
      .sort((a, b) => a.field_position - b.field_position);

    observations.forEach((point, rowIndex) => {
      let colIndex = 1;

      sortedSettings.forEach((setting) => {
        if (setting.fieldname === 'master' || setting.fieldname.includes('observation')) {
          const obsSettings = dynamicHeadings?.observation_heading?.observation_settings || [];
          const obsCount = obsSettings.filter(obs => obs.checkbox === 'yes').length;

          for (let i = 0; i < obsCount; i++) {
            const key = `${rowIndex}-${colIndex}`;
            const value = tableInputValues[key] ?? '';
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
            colIndex++;
          }
        } else if (!['averagemaster', 'error', 'hysterisis', 'repeatability'].includes(setting.fieldname)) {
          const key = `${rowIndex}-${colIndex}`;
          const value = tableInputValues[key] ?? '';
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
          colIndex++;
        } else {
          colIndex++;
        }
      });
    });

    setObservationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [dynamicHeadings, observations, tableInputValues, setObservationErrors]);

  // Build final submission payloads
  const buildSubmissionPayloads = useCallback(() => {
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    const firstRowCalibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[0] || instId;

    // Add thermal coefficients if applicable
    const hasThermalCoeff = dynamicHeadings?.mainhading?.calibration_settings?.some(
      setting => setting.fieldname === 'thermalcoffuuc' || setting.fieldname === 'thermalcoffmaster'
    );

    if (hasThermalCoeff) {
      calibrationPoints.push(firstRowCalibPointId);
      types.push('thermalcoffuuc');
      repeatables.push('0');
      values.push(thermalCoeff.uuc || '0');

      calibrationPoints.push(firstRowCalibPointId);
      types.push('thermalcoffmaster');
      repeatables.push('0');
      values.push(thermalCoeff.master || '0');

      if (thermalCoeff.thickness_of_graduation) {
        calibrationPoints.push(firstRowCalibPointId);
        types.push('thicknessofgraduation');
        repeatables.push('0');
        values.push(thermalCoeff.thickness_of_graduation || '0');
      }
    }

    // Process each row
    selectedTableData.staticRows.forEach((row, rowIndex) => {
      const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex] || '';

      const rowData = row.map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return tableInputValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData);

      if (!dynamicHeadings?.mainhading?.calibration_settings) {
        return;
      }

      const sortedSettings = [...dynamicHeadings.mainhading.calibration_settings]
        .filter(col => col.checkbox === 'yes')
        .sort((a, b) => a.field_position - b.field_position);

      let currentCol = 1;

      sortedSettings.forEach((setting) => {
        const fieldname = setting.fieldname;

        if (fieldname === 'uuc') {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[currentCol] || '0');
          currentCol++;
        } else if (fieldname === 'calculatedmaster') {
          calibrationPoints.push(calibPointId);
          types.push('calculatedmaster');
          repeatables.push('0');
          values.push(rowData[currentCol] || '0');
          currentCol++;
        } else if (fieldname === 'master' || fieldname.includes('observation')) {
          const obsCount = dynamicHeadings?.observation_heading?.observation_settings?.filter(obs => obs.checkbox === 'yes').length || 3;

          for (let i = 0; i < obsCount; i++) {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(i.toString());
            values.push(rowData[currentCol] || '0');
            currentCol++;
          }

          // Add calculated values
          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(calculated.average || '0');

          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(calculated.error || '0');

          calibrationPoints.push(calibPointId);
          types.push('hysterisis');
          repeatables.push('0');
          values.push(calculated.hysteresis || '0');
        } else {
          currentCol++;
        }
      });
    });

    return { calibrationPoints, types, repeatables, values };
  }, [selectedTableData, tableInputValues, thermalCoeff, dynamicHeadings, instId, calculateRowValues]);

  // Fetch observations on mount
  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  return {
    observations,
    thermalCoeff,
    setThermalCoeff,
    createObservationRows,
    handleInputChange,
    handleObservationBlur,
    handleRowSave,
    handleThermalCoeffBlur,
    validateObservationFields,
    buildSubmissionPayloads,
    refetchObservations,
  };
};