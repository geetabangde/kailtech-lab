// ==========================================
// FormSubmitHandler.jsx
// ==========================================
import axios from 'utils/axios';
import { toast } from 'sonner';
import { JWT_HOST_API } from "configs/auth.config";

export const FormSubmitHandler = ({
  inwardId,
  instId,
  caliblocation,
  calibacc,
  formData,
  selectedTableData,
  dynamicHeadings,
  tableInputValues,
  thermalCoeff,
  calculateRowValues,
  navigate,
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    const firstRowCalibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[0] || instId;

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

    selectedTableData.staticRows.forEach((row, rowIndex) => {
      const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex] || '';

      const rowData = row.map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return tableInputValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData);

      if (!dynamicHeadings?.mainhading?.calibration_settings) return;

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

    const payloadStep3 = {
      inwardid: inwardId,
      instid: instId,
      caliblocation: caliblocation,
      calibacc: calibacc,
      tempend: formData.tempend,
      humiend: formData.humiend,
      notes: formData.notes,
      enddate: formData.enddate,
      duedate: formData.duedate,
      calibrationpoint: calibrationPoints,
      type: types,
      repeatable: repeatables,
      value: values,
    };

    try {
      const response = await axios.post(
        `${JWT_HOST_API}/calibrationprocess/insert-calibration-step3`,
        payloadStep3,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Response from step 3 submission:', response.data);
    
      toast.success('All data submitted successfully!');
      setTimeout(() => {
        navigate(
          `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
      }, 1000);
    } catch (error) {
      console.error('Network Error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong while submitting');
    }
  };

  return { handleSubmit };
};