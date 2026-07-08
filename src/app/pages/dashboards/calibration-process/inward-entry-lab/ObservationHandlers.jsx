// ==========================================
// ObservationHandlers.jsx
// ==========================================
import axios from 'utils/axios';
import { toast } from 'sonner';
import { JWT_HOST_API } from "configs/auth.config";

export const ObservationHandlers = ({
  inwardId,
  instId,
  dynamicHeadings,
  selectedTableData,
  leastCountData,
  tableInputValues,
  setTableInputValues,
  
  setObservationErrors,
  calculateRowValues,
  refetchObservations,
}) => {
  const handleInputChange = (rowIndex, colIndex, value) => {
    setTableInputValues((prev) => {
      const newValues = { ...prev };
      const key = `${rowIndex}-${colIndex}`;
      newValues[key] = value;

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

      const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return newValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData);

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
  };

  const handleObservationBlur = async (rowIndex) => {
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

    const calculated = calculateRowValues(rowData);
    const payloads = [];

    if (!dynamicHeadings?.mainhading?.calibration_settings) return;

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
  };

  const handleRowSave = async (rowIndex) => {
    await handleObservationBlur(rowIndex);
  };

  const handleThermalCoeffBlur = async (type, value) => {
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
  };

  return {
    handleInputChange,
    handleObservationBlur,
    handleRowSave,
    handleThermalCoeffBlur,
  };
};
