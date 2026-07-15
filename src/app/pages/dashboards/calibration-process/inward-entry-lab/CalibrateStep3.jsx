

// This is all new file jisme mene ctg and mm me validation lagaya hai ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Page } from 'components/shared/Page';
import { Button } from 'components/ui/Button';
import { toast } from 'sonner';
import axios from 'utils/axios';
import Select from 'react-select';
import { JWT_HOST_API, IMAGE_HOST_API } from "configs/auth.config";

const CalibrateStep3 = () => {
  const navigate = useNavigate();
  const { id, itemId: instId } = useParams();
  const inwardId = id;
  const searchParams = new URLSearchParams(window.location.search);
  const caliblocation = searchParams.get('caliblocation') || 'Lab';
  const calibacc = searchParams.get('calibacc') || 'Nabl';

  const [instrument, setInstrument] = useState(null);
  const [inwardEntry, setInwardEntry] = useState(null);
  const [masters, setMasters] = useState([]);
  const [supportMasters, setSupportMasters] = useState([]);
  const [observationTemplate, setObservationTemplate] = useState(null);
  const [temperatureRange, setTemperatureRange] = useState(null);
  const [humidityRange, setHumidityRange] = useState(null);
  const [observations, setObservations] = useState([]);
  const [observationErrors, setObservationErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [visualTests, setVisualTests] = useState([]);
  const [safetyTests, setSafetyTests] = useState([]);
  const [visualTestInputs, setVisualTestInputs] = useState({});
  const [safetyTestInputs, setSafetyTestInputs] = useState({});
  const [leastCountData, setLeastCountData] = useState({});
  const [tableInputValues, setTableInputValues] = useState({});
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [formData, setFormData] = useState({
    enddate: '',
    duedate: '',
    notes: '',
    tempend: '',
    humiend: '',
    pressurestart: '',
    pressureend: '',
    stabilizationtime: '',
  });

  // Helper function to safely format date
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      console.warn('Invalid date format:', dateString);
      return '';
    }
  };

  const [unitsList, setUnitsList] = useState([]);
  const [diagram, setDiagram] = useState('');
  const [roomTemperature, setRoomTemperature] = useState('');




  // Fetch units list for ReactSelect
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await axios.get(`${JWT_HOST_API}/master/units-list`);
        if (response.data.status && response.data.data) {
          setUnitsList(response.data.data.map(unit => ({
            value: unit.id,
            label: unit.name
          })));
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    // ✅ CHANGED: Fetch units for both RTD WI and GTM
    if (observationTemplate === 'observationrtdwi' || observationTemplate === 'observationgtm') {
      fetchUnits();
    }
  }, [observationTemplate]);

  useEffect(() => {
    axios
      .get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
        params: {
          inward_id: inwardId,
          instid: instId,
          caliblocation: caliblocation,
          calibacc: calibacc,
        },
      })
      .then((res) => {
        console.log('✅ API Data:', res.data);
        const data = res.data;

        setInwardEntry(data.inwardEntry);
        setInstrument(data.instrument);
        setMasters(data.masters || []);
        setSupportMasters(data.supportMasters || []);
        setObservationTemplate(data.observationTemplate);
        setTemperatureRange(data.temperatureRange);
        setHumidityRange(data.humidityRange);
        setVisualTests(data.visual_inspection || []);
        setSafetyTests(data.basic_safety_test || []);

        if (data.instrument?.daigram) {
          setDiagram(data.instrument.daigram);
        } else if (data.instrument?.diagram) {
          setDiagram(data.instrument.diagram);
        }

        setFormData((prev) => ({
          ...prev,
          enddate: formatDateForInput(data.instrument?.enddate),
          humiend: data.instrument?.humiend || '',
          tempend: data.instrument?.tempend || '',
          duedate: formatDateForInput(data.instrument?.duedate),
          pressurestart: data.instrument?.pressurestart || '',
          pressureend: data.instrument?.pressureend || '',
          stabilizationtime: data.instrument?.stabilizationtime || '',
          temperatureEnd: data.temperatureRange?.min && data.temperatureRange?.max
            ? `${data.temperatureRange.min} - ${data.temperatureRange.max}`
            : data.temperatureRange?.value || '',
          humidityEnd: data.humidityRange?.min && data.humidityRange?.max
            ? `${data.humidityRange.min} - ${data.humidityRange.max}`
            : data.humidityRange?.value || '',
        }));

        // Calculate initial room temperature for UTM
        if (observationTemplate === 'observationutm') {
          const startTemp = parseFloat(data.inwardEntry?.temperature) || 0;
          const endTemp = parseFloat(data.instrument?.tempend) || 0;
          if (startTemp && endTemp) {
            setRoomTemperature(((startTemp + endTemp) / 2).toFixed(1));
          }
        }
      })
      .catch((err) => {
        console.error('❌ API Error:', err.response?.data || err);
        toast.error('Failed to fetch calibration data');
      });
  }, [inwardId, instId, caliblocation, calibacc]);

  // Recalculate room temperature and UUC values when temperature changes for UTM
  useEffect(() => {
    if (observationTemplate === 'observationutm') {
      const startTemp = parseFloat(inwardEntry?.temperature) || 0;
      const endTemp = parseFloat(formData.temprend) || 0;
      if (startTemp && endTemp) {
        const newRoomTemp = ((startTemp + endTemp) / 2).toFixed(1);
        setRoomTemperature(newRoomTemp);

        // Recalculate UUC values for all point rows
        const newValues = { ...tableInputValues };
        if (selectedTableData?.rowMeta) {
          selectedTableData.rowMeta.forEach((meta, rowIndex) => {
            if (meta.kind === 'point') {
              const calculatedUucKey = `${rowIndex}-2`;
              const uucKey = `${rowIndex}-3`;
              const calculatedUuc = tableInputValues[calculatedUucKey] || selectedTableData.staticRows[rowIndex]?.[2];
              if (calculatedUuc) {
                newValues[uucKey] = applyTemperatureCompensation(calculatedUuc);
              }
            }
          });
          setTableInputValues(newValues);
        }
      }
    }
  }, [formData.temprend, inwardEntry?.temperature, observationTemplate]);

  const safeGetValue = (item) => {
    if (!item) return '';
    if (typeof item === 'object' && item !== null) {
      return item.value !== null && item.value !== undefined ? item.value : '';
    }
    return item.toString();
  };

  const safeGetArray = (item, defaultLength = 0) => {
    if (!item) return Array(defaultLength).fill('');
    if (Array.isArray(item)) return item;
    if (typeof item === 'string') return [item];
    return Array(defaultLength).fill('');
  };

  const validateForm = () => {
    let newErrors = {};

    // Temperature validation
    if (!formData.tempend || formData.tempend.trim() === '') {
      newErrors.tempend = 'This field is required';
    } else {
      const temp = parseFloat(formData.tempend);
      if (temperatureRange) {
        if (temperatureRange.min !== undefined && temperatureRange.max !== undefined) {
          if (isNaN(temp) || temp < temperatureRange.min || temp > temperatureRange.max) {
            newErrors.tempend = `Temperature must be between ${temperatureRange.min} and ${temperatureRange.max}`;
          }
        } else if (temperatureRange.value !== undefined) {
          if (isNaN(temp) || temp !== temperatureRange.value) {
            newErrors.tempend = `Temperature must be ${temperatureRange.value}`;
          }
        }
      }
    }

    // Humidity validation
    if (!formData.humiend || formData.humiend.trim() === '') {
      newErrors.humiend = 'This field is required';
    } else {
      const humi = parseFloat(formData.humiend);
      if (humidityRange) {
        if (humidityRange.min !== undefined && humidityRange.max !== undefined) {
          if (isNaN(humi) || humi < humidityRange.min || humi > humidityRange.max) {
            newErrors.humiend = `Humidity must be between ${humidityRange.min} and ${humidityRange.max}`;
          }
        } else if (humidityRange.value !== undefined) {
          if (isNaN(humi) || humi !== humidityRange.value) {
            newErrors.humiend = `Humidity must be ${humidityRange.value}`;
          }
        }
      }
    }

    // Pressure & Stabilization validation for Dead Weight
    if (selectedTableData?.id === 'observationdw') {
      if (!formData.pressurestart || formData.pressurestart.trim() === '') {
        newErrors.pressurestart = 'This field is required';
      }
      if (!formData.pressureend || formData.pressureend.trim() === '') {
        newErrors.pressureend = 'This field is required';
      }
      if (!formData.stabilizationtime || formData.stabilizationtime.trim() === '') {
        newErrors.stabilizationtime = 'This field is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const validateObservationFields = () => {
    let newErrors = {};

    if (!selectedTableData || !selectedTableData.staticRows) {
      return true; // No validation needed if no data
    }

    if (selectedTableData?.id === 'observationwb' && !diagram) {
      toast.error('Please select a Diagram Choice.');
      return false;
    }

    // Determine the highest nominal value row for specific templates
    let maxNominalRowIndex = -1;
    if (['observationmt', 'observationctg', 'observationfg', 'observationmsr'].includes(selectedTableData.id)) {
      let maxNominal = -Infinity;
      selectedTableData.staticRows.forEach((row, rowIndex) => {
        const nominalKey = `${rowIndex}-1`;
        const nominalValueStr = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        const nominalValue = parseFloat(nominalValueStr);
        if (!isNaN(nominalValue) && nominalValue >= maxNominal) {
          maxNominal = nominalValue;
          maxNominalRowIndex = rowIndex;
        }
      });
    }

    selectedTableData.staticRows.forEach((row, rowIndex) => {
      if (selectedTableData.id === 'observationmm') {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId];
        if (!leastCount) {
          console.warn(`⚠️ Least count not found for calibration point ${calibPointId}`);
          return; // Skip validation if least count not available
        }

        // Range (column 2) - required
        const rangeKey = `${rowIndex}-2`;
        const rangeValue = tableInputValues[rangeKey] ?? (row[2]?.toString() || '');
        if (!rangeValue.trim()) {
          newErrors[rangeKey] = 'This field is required';
        }

        // Observations 1-5 (columns 5-9) - validate with least count
        for (let col = 5; col <= 9; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');

          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else {
            const numValue = parseFloat(value);

            // Check if value is less than least count
            if (numValue < leastCount) {
              newErrors[key] = `Please enter a value with in leastcount ${leastCount}`;
            }
            // Check if value is divisible by least count
            else if (numValue % leastCount !== 0) {
              newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
            }
          }
        }
      } else if (selectedTableData.id === 'observationexm') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationwbn') {
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }
        // W1, W2, W3
        for (let col = 2; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
        // R1 - R5
        for (let col = 7; col <= 11; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
        // CW1-CW5, ACW1-ACW5
        for (let col = 13; col <= 22; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationppg') {
        // M1-M6 (columns 3-8) are required
        for (let col = 3; col <= 8; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationavg') {
        // SET PRESSURE ON UUC (columns 1, 2) and M1, M2 (columns 3, 4) are required
        for (let col = 3; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationfg') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            const isOptional = (col === 5 || col === 6) && rowIndex !== maxNominalRowIndex;

            if (!value.trim() && !isOptional) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationdg') {
        // Nominal value (column 1) and Set readings (columns 2-5) are required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Set 1 Forward, Set 1 Backward, Set 2 Forward, Set 2 Backward (columns 2-5)
        for (let col = 2; col <= 5; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationtm') {
        const rangeKey = `${rowIndex}-3`;
        const rangeValue = tableInputValues[rangeKey] ?? (row[3]?.toString() || '');
        if (!rangeValue.trim()) {
          newErrors[rangeKey] = 'This field is required';
        }
        for (let col = 4; col <= 23; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationmsr') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, msrRowIndex) => {
          // Nominal value
          const nominalKey = `${msrRowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${msrRowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            const isOptional = (col === 5 || col === 6) && msrRowIndex !== maxNominalRowIndex;

            if (!value.trim() && !isOptional) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationhg') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationit') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationmg') {
        // SET PRESSURE ON UUC (columns 1, 2) and M1, M2 (columns 3, 4) are required
        for (let col = 1; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationmt') {
        // Nominal UUC value and configured master observations are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex], 10) || 5;
          for (let col = 2; col < 2 + repeatableCycle; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            const isOptional = (col === 5 || col === 6) && rowIndex !== maxNominalRowIndex;

            if (!value.trim() && !isOptional) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      }

      else if (selectedTableData.id === 'observationctg') {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId];

        if (!leastCount) {
          console.warn(`⚠️ Least count not found for calibration point ${calibPointId}`);
          return; // Skip validation if least count not available
        }

        // Nominal value (column 1) - required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6) - validate with least count
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          const isOptional = (col === 5 || col === 6) && rowIndex !== maxNominalRowIndex;

          if (!value.trim()) {
            if (!isOptional) {
              newErrors[key] = 'This field is required';
            }
          } else {
            const numValue = parseFloat(value);

            // Check if value is less than least count
            if (numValue < leastCount) {
              newErrors[key] = `Please enter a value with in leastcount ${leastCount}`;
            }
            // Check if value is divisible by least count
            else if (numValue % leastCount !== 0) {
              newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
            }
          }
        }
      } else if (selectedTableData.id === 'observationdpg' || selectedTableData.id === 'observationapg') {
        // SET PRESSURE ON UUC (columns 1, 2) and M1, M2, M3 (columns 3, 4, 5) are required
        for (let col = 1; col <= 5; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationodfm') {
        // Range (column 1) and Observations 1-5 (columns 3-7) are required
        const rangeKey = `${rowIndex}-1`;
        const rangeValue = tableInputValues[rangeKey] ?? (row[1]?.toString() || '');
        if (!rangeValue.trim()) {
          newErrors[rangeKey] = 'This field is required';
        }

        // Observations 1-5 (columns 3-7)
        for (let col = 3; col <= 7; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationgtm') {
        const rowType = row[2]; // 'UUC' or 'Master'

        if (rowType === 'UUC') {
          // Set Point (column 1) required
          const setPointKey = `${rowIndex}-1`;
          const setPointValue = tableInputValues[setPointKey] ?? (row[1]?.toString() || '');
          if (!setPointValue.trim()) {
            newErrors[setPointKey] = 'This field is required';
          }

          // Range (column 3) required
          const rangeKey = `${rowIndex}-3`;
          const rangeValue = tableInputValues[rangeKey] ?? (row[3]?.toString() || '');
          if (!rangeValue.trim()) {
            newErrors[rangeKey] = 'This field is required';
          }

          // Unit (column 4) required
          const unitKey = `${rowIndex}-4`;
          const unitValue = tableInputValues[unitKey] ?? (row[4]?.toString() || '');
          if (!unitValue.trim()) {
            newErrors[unitKey] = 'This field is required';
          }

          // Observations 1-5 (columns 6-10) required
          for (let col = 6; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        } else if (rowType === 'Master') {
          // Unit (column 4) required
          const unitKey = `${rowIndex}-4`;
          const unitValue = tableInputValues[unitKey] ?? (row[4]?.toString() || '');
          if (!unitValue.trim()) {
            newErrors[unitKey] = 'This field is required';
          }

          // Sensitivity Coefficient (column 5) required
          const sensKey = `${rowIndex}-5`;
          const sensValue = tableInputValues[sensKey] ?? (row[5]?.toString() || '');
          if (!sensValue.trim()) {
            newErrors[sensKey] = 'This field is required';
          }

          // Observations 1-5 (columns 6-10) required
          for (let col = 6; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }

          // Average (Ω) (column 11) required
          const avgKey = `${rowIndex}-11`;
          const avgValue = tableInputValues[avgKey] ?? (row[11]?.toString() || '');
          if (!avgValue.trim()) {
            newErrors[avgKey] = 'This field is required';
          }

          // Average (°C) (column 12) required
          const avgCKey = `${rowIndex}-12`;
          const avgCValue = tableInputValues[avgCKey] ?? (row[12]?.toString() || '');
          if (!avgCValue.trim()) {
            newErrors[avgCKey] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationuc') {
        // Range (col 2), Calculated Value (col 3), Set Value (col 4) are required
        for (let col = 2; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }

        // Observations 1-5 (col 5-9) are required
        for (let col = 5; col <= 9; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      }
      else if (selectedTableData.id === 'observationth') {
        const rowType = row[1]; // UUC or Master
        const calibPointId = selectedTableData.calibrationPoints?.[rowIndex];
        const lcs = leastCountData[calibPointId];
        const leastCount = rowType === 'UUC' ? (lcs?.uuc ?? 0.001) : (lcs?.master ?? 0.001);

        if (rowType === 'UUC') {
          // Range is required
          const rangeKey = `${rowIndex}-2`;
          const rangeValue = tableInputValues[rangeKey] ?? (row[2]?.toString() || '');
          if (!rangeValue.trim()) {
            newErrors[rangeKey] = 'This field is required';
          }
        }

        // Observations 1-5 (columns 5-9) are required
        for (let col = 5; col <= 9; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else if (leastCount) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue !== 0) {
              if (numValue < leastCount) {
                newErrors[key] = `Please enter a value within least count ${leastCount}`;
              } else if (numValue % leastCount !== 0) {
                newErrors[key] = `Please enter a value divisible by ${leastCount}`;
              }
            }
          }
        }
      }
      else if (selectedTableData.id === 'observationwb') {
        const weighingCount = selectedTableData.weighingCount || 0;
        const repeatabilityCount = selectedTableData.repeatabilityCount || 0;

        if (rowIndex < weighingCount) {
          for (let col = 2; col <= 4; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        } else if (rowIndex < weighingCount + repeatabilityCount) {
          for (let col = 1; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        } else {
          for (let col = 1; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        }
      }
    });

    setObservationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Shared transform: converts DW API response (cycles array) → flat arrays expected by createObservationRows
  const transformDwObservations = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return null;
    return rawData.map((point) => ({
      point_id: point.pointid ?? point.point_id ?? point.sr_no,  // API returns 'pointid'
      sr_no: point.sr_no,
      nominal_value: point.nominal_value,
      test_point: point.test_point,
      density: point.density,
      repeatable_cycle: point.cycles?.length || 3,
      s1: point.cycles?.map((c) => c.S1 ?? c.s1 ?? null) || [],
      u1: point.cycles?.map((c) => c.U1 ?? c.u1 ?? null) || [],
      u2: point.cycles?.map((c) => c.U2 ?? c.u2 ?? null) || [],
      s2: point.cycles?.map((c) => c.S2 ?? c.s2 ?? null) || [],
      deltai: point.cycles?.map((c) => c.Delta ?? c.deltai ?? null) || [],
      average_diff: point.average_diff,
    }));
  };

  useEffect(() => {
    const fetchObservations = async () => {
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

        const isSuccess = response.data.status === true || response.data.staus === true || response.data.success === true;

        if (isSuccess && response.data.data) {
          const observationData = response.data.data;
          console.log('📊 Observation Data:', observationData);

          if (observationTemplate === 'observationmt' && observationData.thermal_coeff) {
            setThermalCoeff({
              uuc: observationData.thermal_coeff.uuc || '',
              master: observationData.thermal_coeff.master || '',
              thickness_of_graduation: observationData.thermal_coeff.thickness_of_graduation || '',
            });
          }

          if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
            console.log('Setting ODFM observations:', observationData.calibration_points);
            setObservations(observationData.calibration_points);
          } else if (observationTemplate === 'observationdpg' && observationData.observations) {
            // console.log('✅ Setting DPG Observations:', observationData.observations);
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationapg') {
            setObservations(observationData);
          }
          else if (observationTemplate === 'observationmm') {
            console.log('🔍 Processing observationmm data structure');

            // ✅ NEW: Initialize least count map
            const leastCountMap = {};

            // Try different possible data structures for MM
            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('Setting MM observations from calibration_points:', observationData.calibration_points);
              setObservations(observationData.calibration_points);

              // Extract least count data
              observationData.calibration_points.forEach(point => {
                if (point.point_id && point.precision) {
                  // Check mode: Source -> uuc_least_count, Measure -> master_least_count
                  const mode = point.mode?.toLowerCase();
                  if (mode === 'source' && point.precision.uuc_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                  } else if (mode === 'measure' && point.precision.master_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.master_least_count);
                  }
                }
              });
            } else if (observationData.data && Array.isArray(observationData.data)) {
              console.log('Setting MM observations from data:', observationData.data);
              setObservations(observationData.data);

              // Extract least count data from nested structure
              observationData.data.forEach(unitTypeGroup => {
                if (unitTypeGroup.calibration_points) {
                  unitTypeGroup.calibration_points.forEach(point => {
                    if (point.point_id && point.precision?.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    }
                  });
                }
              });
            } else if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
              console.log('Setting MM observations from unit_types:', observationData.unit_types);
              setObservations(observationData.unit_types);

              // Extract least count data from unit_types structure
              observationData.unit_types.forEach(unitTypeGroup => {
                if (unitTypeGroup.calibration_points) {
                  unitTypeGroup.calibration_points.forEach(point => {
                    if (point.point_id && point.precision?.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    }
                  });
                }
              });
            } else if (Array.isArray(observationData)) {
              console.log('Setting MM observations directly:', observationData);
              setObservations(observationData);

              // Extract least count data from array structure
              observationData.forEach(item => {
                if (item.calibration_points) {
                  item.calibration_points.forEach(point => {
                    if (point.point_id && point.precision?.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    }
                  });
                } else if (item.point_id && item.precision?.uuc_least_count) {
                  // Direct point structure
                  leastCountMap[item.point_id] = parseFloat(item.precision.uuc_least_count);
                }
              });
            } else {
              console.log('No MM observations found in expected format, trying to extract from object');

              // Try to extract calibration points from the object structure
              const possiblePoints = Object.values(observationData).filter(
                item => item && typeof item === 'object' && (item.sr_no !== undefined || item.sequence_number !== undefined)
              );

              if (possiblePoints.length > 0) {
                console.log('Found potential MM points:', possiblePoints);
                setObservations(possiblePoints);

                // Extract least count from found points
                possiblePoints.forEach(point => {
                  if (point.point_id && point.precision?.uuc_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                  }
                });
              } else {
                console.log('No MM observations found');
                setObservations([]);
              }
            }

            // ✅ Store least count data for validation
            console.log('📊 MM Least Count Map:', leastCountMap);
            setLeastCountData(leastCountMap);
          }
          else if (observationTemplate === 'observationavg') {
            console.log('Setting AVG observations:', observationData);

            const avgData = observationData.data || observationData;

            if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
              console.log('✅ AVG calibration_point found:', avgData.calibration_point);
              setObservations(avgData.calibration_point);
            } else {
              console.log('❌ No AVG calibration_point found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationes') {
            console.log('Setting ES observations:', observationData);
            const esData = observationData.data || observationData;
            const measure = Array.isArray(esData.performance_testing_measure) ? esData.performance_testing_measure : [];
            const source = Array.isArray(esData.performance_testing_source) ? esData.performance_testing_source : [];
            if (measure.length > 0 || source.length > 0) {
              setObservations([...measure, ...source]);
            } else if (esData.calibration_points && Array.isArray(esData.calibration_points)) {
              setObservations(esData.calibration_points);
            } else if (esData.observations && Array.isArray(esData.observations)) {
              setObservations(esData.observations);
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationppg' && observationData.observations) {
            console.log('✅ Setting PPG Observations:', observationData.observations);
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationmg') {
            console.log('Setting MG observations:', observationData);

            // Handle nested data structure for MG
            const mgData = observationData.data || observationData;

            if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
              console.log('✅ MG calibration_points found:', mgData.calibration_points);
              setObservations(mgData.calibration_points);
            } else if (mgData.observations && Array.isArray(mgData.observations)) {
              console.log('✅ MG observations found:', mgData.observations);
              setObservations(mgData.observations);
            } else {
              console.log('❌ No MG calibration_points found');
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationrtdwi') {
            console.log('Setting RTD WI observations:', observationData);

            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('✅ RTD WI calibration_points found:', observationData.calibration_points.length, 'points');
              setObservations(observationData.calibration_points);
            } else {
              console.log('❌ No RTD WI calibration_points found');
              setObservations([]);
            }
          }
          else if (observationTemplate === 'observationfg') {
            console.log('Setting FG observations:', observationData);

            // Handle nested data structure for FG
            const fgData = observationData.data || observationData;

            // Check if calibration_points exists directly
            if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
              console.log('✅ FG calibration_points found directly:', fgData.calibration_points);
              setObservations(fgData.calibration_points);

              // Handle thermal coefficients for FG
              if (fgData.thermal_coefficients) {
                setThermalCoeff({
                  uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
                  master: fgData.thermal_coefficients.thermal_coeff_master || '',
                  thickness_of_graduation: '' // FG doesn't use this field
                });
                console.log('✅ FG Thermal coefficients set:', fgData.thermal_coefficients);
              }
            }
            // Check if unit_types exists (for backward compatibility)
            else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
              console.log('✅ FG unit_types found:', fgData.unit_types);
              setObservations(fgData.unit_types);

              // Handle thermal coefficients for FG
              if (fgData.thermal_coeff) {
                setThermalCoeff({
                  uuc: fgData.thermal_coeff.uuc || '',
                  master: fgData.thermal_coeff.master || '',
                  thickness_of_graduation: '' // FG doesn't use this field
                });
                console.log('✅ FG Thermal coefficients set:', fgData.thermal_coeff);
              }
            } else {
              console.log('❌ No FG calibration_points or unit_types found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationexm') {
            console.log('Setting EXM observations:', observationData);

            // EXM structure is similar to HG but thermal coefficients are directly uuc/master
            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('✅ EXM calibration_points found:', observationData.calibration_points);
              setObservations(observationData.calibration_points);

              // Handle thermal coefficients - different from HG
              if (observationData.thermal_coefficients) {
                setThermalCoeff({
                  uuc: observationData.thermal_coefficients.uuc || '',
                  master: observationData.thermal_coefficients.master || '',
                  thickness_of_graduation: '' // EXM doesn't use this field
                });
                console.log('✅ EXM Thermal coefficients set:', observationData.thermal_coefficients);
              }
            } else {
              console.log('❌ No EXM calibration_points found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationgtm') {
            console.log('Setting GTM observations:', observationData);

            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('✅ GTM calibration_points found:', observationData.calibration_points.length, 'points');
              setObservations(observationData.calibration_points);
            } else {
              console.log('❌ No GTM calibration_points found');
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationit') {
            console.log('Setting IT observations:', observationData);

            // Handle nested data structure
            const itData = observationData.data || observationData;

            if (itData.calibration_points) {
              console.log('✅ IT calibration_points found:', itData.calibration_points);
              setObservations(itData.calibration_points);

              // FIX: Handle thermal coefficients for IT with correct keys
              if (itData.thermal_coefficients) {
                setThermalCoeff(prev => ({
                  uuc: itData.thermal_coefficients.uuc_coefficient || '',
                  master: itData.thermal_coefficients.master_coefficient || '',
                  thickness_of_graduation: prev.thickness_of_graduation || '', // preserve existing
                }));
                console.log('✅ IT Thermal coefficients set:', {
                  uuc: itData.thermal_coefficients.uuc_coefficient,
                  master: itData.thermal_coefficients.master_coefficient
                });
              }
            } else {
              console.log('❌ No IT calibration_points found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationhg') {
            console.log('Setting HG observations:', observationData);

            // HG has calibration_points in the second object of the array
            const hgData = observationData[1] || observationData;

            if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
              console.log('✅ HG calibration_points found:', hgData.calibration_points);
              setObservations(hgData.calibration_points);

              // Handle thermal coefficients from the first object
              if (observationData[0] && observationData[0].thermal_coefficients) {
                setThermalCoeff({
                  uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
                  master: observationData[0].thermal_coefficients.master_coefficient || '',
                  thickness_of_graduation: '' // HG doesn't use this field
                });
                console.log('✅ HG Thermal coefficients set:', observationData[0].thermal_coefficients);
              }
            } else {
              console.log('❌ No HG calibration_points found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationmsr') {
            console.log('Setting MSR observations:', observationData);

            // Handle array structure - MSR returns array with unit types
            if (Array.isArray(observationData) && observationData.length > 0) {
              const msrData = observationData[0]; // Get first unit type object

              if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
                console.log('✅ MSR calibration_points found:', msrData.calibration_points);
                setObservations(msrData.calibration_points);

                // Handle thermal coefficients
                if (msrData.thermal_coeff) {
                  setThermalCoeff({
                    uuc: msrData.thermal_coeff.uuc || '',
                    master: msrData.thermal_coeff.master || '',
                    thickness_of_graduation: '' // MSR doesn't use this field
                  });
                  console.log('✅ MSR Thermal coefficients set:', msrData.thermal_coeff);
                }
              } else {
                console.log('❌ No MSR calibration_points found');
                setObservations([]);
              }
            } else {
              console.log('❌ MSR data not in expected array format');
              setObservations([]);
            }
          }
          else if (observationTemplate === 'observationmt') {
            console.log('Setting MT observations:', observationData);

            // Handle nested data structure for MT
            const mtData = observationData.data || observationData;

            if (mtData.calibration_points) {
              console.log('✅ MT calibration_points found:', mtData.calibration_points);
              setObservations(mtData.calibration_points);

              // Handle thermal coefficients for MT
              if (mtData.thermal_coeff) {
                setThermalCoeff({
                  uuc: mtData.thermal_coeff.uuc || '',
                  master: mtData.thermal_coeff.master || '',
                  thickness_of_graduation: mtData.thermal_coeff.thickness_of_graduation || ''
                });
                console.log('✅ MT Thermal coefficients set:', mtData.thermal_coeff);
              }
            } else {
              console.log('❌ No MT calibration_points found');
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationdg') {
            console.log('🔍 Setting DG observations:', observationData);

            // DG can return data in multiple formats - handle all cases
            if (observationData.observations && Array.isArray(observationData.observations)) {
              console.log('✅ DG observations found:', observationData.observations.length, 'points');
              setObservations(observationData.observations);
            } else if (Array.isArray(observationData)) {
              // Fallback if data is directly an array
              console.log('✅ DG observations as array:', observationData.length, 'points');
              setObservations(observationData);
            } else {
              console.log('❌ No DG observations found in expected format');
              setObservations([]);
            }

            // Handle thermal coefficients for DG
            if (observationData.thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData.thermal_coefficients.uuc || '',
                master: observationData.thermal_coefficients.master || '',
                thickness_of_graduation: '' // DG doesn't use this field
              });
              console.log('✅ DG Thermal coefficients set:', observationData.thermal_coefficients);
            }
          }

          else if (observationTemplate === 'observationdw') {
            console.log('🔍 Setting DW observations (initial):', observationData);

            // API returns: { data: [{sr_no, nominal_value, density, cycles:[{cycle_no,S1,U1,U2,S2,Delta}], average_diff}] }
            const rawData =
              observationData.calibration_points && Array.isArray(observationData.calibration_points)
                ? observationData.calibration_points
                : observationData.data && Array.isArray(observationData.data)
                  ? observationData.data
                  : Array.isArray(observationData)
                    ? observationData
                    : null;

            const transformed = transformDwObservations(rawData);
            if (transformed) {
              console.log('✅ DW transformed observations:', transformed.length, 'points');
              setObservations(transformed);
            } else {
              console.log('❌ No DW observations found in expected format');
              setObservations([]);
            }
          }


          else if (observationTemplate === 'observationutm') {
            console.log('Setting UTM observations:', observationData);

            const utmData =
              observationData.matrices && Array.isArray(observationData.matrices)
                ? observationData.matrices
                : observationData.matrix && Array.isArray(observationData.matrix)
                  ? observationData.matrix
                  : observationData.data && Array.isArray(observationData.data)
                    ? observationData.data
                    : observationData.calibration_points && Array.isArray(observationData.calibration_points)
                      ? [{ calibration_points: observationData.calibration_points }]
                      : Array.isArray(observationData)
                        ? observationData
                        : [observationData];

            setObservations(utmData.filter(Boolean));
          }

          else if (observationTemplate === 'observationctg' && observationData.points) {
            console.log(
              'CTG Points with IDs:',
              observationData.points.map((p) => ({
                id: p.id,
                sr_no: p.sr_no,
              }))
            );
            setObservations(observationData.points);

            // ✅ NEW: Extract least count data for CTG
            const leastCountMap = {};
            observationData.points.forEach(point => {
              if (point.id && point.least_count) {
                leastCountMap[point.id] = parseFloat(point.least_count);
              }
            });
            setLeastCountData(leastCountMap);
            console.log('📊 CTG Least Count Map:', leastCountMap);

            if (observationTemplate === 'observationctg' && observationData.thermal_coeff) {
              setThermalCoeff({
                uuc: observationData.thermal_coeff.uuc || '',
                master: observationData.thermal_coeff.master || '',
              });
            }
          } else if (observationTemplate === 'observationtm') {
            console.log('Setting TM observations:', observationData);
            if (Array.isArray(observationData)) {
              setObservations(observationData);
            } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              setObservations(observationData.calibration_points);
            } else if (observationData.data && Array.isArray(observationData.data)) {
              setObservations(observationData.data);
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationuc') {
            console.log('Setting UC observations:', observationData);
            const ucData = observationData.data || observationData;

            if (ucData.measure_data || ucData.source_data) {
              const combined = [];
              if (Array.isArray(ucData.measure_data)) {
                combined.push(...ucData.measure_data.map(p => ({ ...p, mode: 'Measure' })));
              }
              if (Array.isArray(ucData.source_data)) {
                combined.push(...ucData.source_data.map(p => ({ ...p, mode: 'Source' })));
              }
              setObservations(combined);
            } else if (Array.isArray(ucData)) {
              setObservations(ucData);
            } else if (ucData.calibration_points && Array.isArray(ucData.calibration_points)) {
              setObservations(ucData.calibration_points);
            } else if (ucData.points && Array.isArray(ucData.points)) {
              setObservations(ucData.points);
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationth') {
            const points = Array.isArray(observationData)
              ? observationData
              : (observationData.data || observationData.calibration_points || []);

            const leastCountMap = {};
            points.forEach(point => {
              const calibPointId = point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString();
              if (calibPointId) {
                leastCountMap[calibPointId] = {
                  uuc: parseFloat(point.value_shown_on?.uuc?.least_count ?? point.least_count ?? point.leastcount ?? point.precision?.uuc_least_count ?? 0.1),
                  master: parseFloat(point.value_shown_on?.master?.least_count ?? point.master_least_count ?? point.masterleastcount ?? point.precision?.master_least_count ?? 0.01)
                };
              }
            });
            setLeastCountData(leastCountMap);
            setObservations(points);
          } else {
            setObservations([]);
          }
        } else {
          console.log('No observations found');
          setObservations([]);
        }
      } catch (error) {
        console.log('Error fetching observations:', error);
        setObservations([]);
      }
    };

    fetchObservations();
  }, [observationTemplate, instId, inwardId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (!localStorage.getItem('theme')) {
          setTheme(mediaQuery.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const getObservationValueByType = (point, type, repeatable = 0) => {
    const repeatableString = repeatable.toString();
    const candidates = [
      point?.observations,
      point?.summary,
      point?.values,
      point?.saved_values,
      point?.savedValues,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const match = candidate.find(
          (item) => item?.type === type && item?.repeatable?.toString() === repeatableString
        );
        if (match) return safeGetValue(match.value);
      } else if (candidate && typeof candidate === 'object') {
        const keyed = candidate[type];
        if (Array.isArray(keyed)) return safeGetValue(keyed[repeatable]);
        if (keyed && typeof keyed === 'object') {
          return safeGetValue(keyed[repeatable] ?? keyed[repeatableString] ?? keyed.value);
        }
        if (repeatable === 0 && keyed !== undefined) return safeGetValue(keyed);
      }
    }

    const directMap = {
      setpoint: point?.setpoint ?? point?.set_point ?? point?.point ?? point?.test_point,
      calculateduuc: point?.calculateduuc ?? point?.calculated_uuc ?? point?.std_at_reference_temp,
      uuc: point?.uuc ?? point?.uuc0 ?? point?.std_room_temp,
      averagemaster: point?.averagemaster ?? point?.average_master ?? point?.mean,
      error: point?.error,
      percenterror: point?.percenterror ?? point?.percent_error,
      repeatability: point?.repeatability ?? point?.repeatability_error,
      removalforce: point?.removalforce ?? point?.removal_force,
      zeroerror: point?.zeroerror ?? point?.zero_error,
      relativeres: point?.releativeres ?? point?.relative_resolution,
      classofmachine: point?.classofmachine ?? point?.class_of_machine,
      dialguageseting: point?.dialguageseting ?? point?.dial_gauge_setting,
    };

    if (type === 'master') {
      const masterValues = point?.master_values ?? point?.master_readings ?? point?.observed_f ?? point?.observations;
      if (Array.isArray(masterValues)) return safeGetValue(masterValues[repeatable]);
      if (masterValues && typeof masterValues === 'object') {
        return safeGetValue(masterValues[repeatable] ?? masterValues[repeatableString] ?? masterValues[`m${repeatable + 1}`]);
      }
    }

    const directValue = directMap[type];
    if (Array.isArray(directValue)) return safeGetValue(directValue[repeatable]);
    if (directValue && typeof directValue === 'object') {
      return safeGetValue(directValue[repeatable] ?? directValue[repeatableString] ?? directValue.value);
    }
    return repeatable === 0 ? safeGetValue(directValue) : '';
  };

  const normalizeUtmGroups = (observationData) => {
    const source = Array.isArray(observationData) ? observationData : [observationData].filter(Boolean);
    return source.flatMap((item, index) => {
      const calibrationPoints =
        item?.calibration_points ||
        item?.calibrationPoints ||
        item?.points ||
        item?.observations ||
        (item?.point_id || item?.id ? [item] : []);

      if (Array.isArray(calibrationPoints) && calibrationPoints.length > 0) {
        return [{
          matrixId: safeGetValue(item?.matrix_id ?? item?.matrixid ?? item?.id ?? `matrix-${index + 1}`),
          matrixType: item?.matrixtype || item?.matrix_type || item?.name || '',
          leastCount: item?.leastcount ?? item?.least_count ?? item?.matrix?.leastcount,
          minPoint: item?.minpoint ?? item?.min_point,
          maxPoint: item?.maxpoint ?? item?.max_point,
          classOfMachine: item?.classofmachine ?? item?.class_of_machine,
          dialGaugeSetting: item?.dialguageseting ?? item?.dial_gauge_setting,
          calibrationPoints,
          raw: item,
        }];
      }

      return [];
    });
  };

  const calculateUtmValues = (rowData, rowIndex) => {
    const result = {};
    const rowMeta = selectedTableData?.rowMeta?.[rowIndex] || {};

    if (rowMeta.kind === 'removal') {
      const maxPoint = parseFloat(rowMeta.maxPoint) || 0;
      [4, 5, 6].forEach((colIdx, idx) => {
        const removal = parseFloat(rowData[colIdx]);
        result[`zero${idx}`] = maxPoint && !isNaN(removal) ? ((removal / maxPoint) * 100).toFixed(2) : '';
      });
      return result;
    }

    if (rowMeta.kind !== 'point') return result;

    const masterValues = [4, 5, 6]
      .map((colIdx) => parseFloat(rowData[colIdx]))
      .filter((val) => !isNaN(val));
    const average = masterValues.length
      ? masterValues.reduce((sum, val) => sum + val, 0) / masterValues.length
      : null;

    result.average = average !== null ? average.toFixed(3) : '';

    const uuc = parseFloat(rowData[3]);
    const error = average !== null && !isNaN(uuc) ? uuc - average : null;
    result.error = error !== null ? error.toFixed(3) : '';
    result.percentError = error !== null && average
      ? ((error / average) * 100).toFixed(2)
      : '';
    result.repeatability = average && masterValues.length > 1
      ? (((Math.max(...masterValues) - Math.min(...masterValues)) / average) * 100).toFixed(2)
      : '';

    return result;
  };

  const calculateRoomTemperature = () => {
    const startTemp = parseFloat(inwardEntry?.temperature) || 0;
    const endTemp = parseFloat(formData.temprend) || 0;
    if (startTemp && endTemp) {
      return ((startTemp + endTemp) / 2).toFixed(1);
    }
    return '';
  };

  const applyTemperatureCompensation = (calculatedUuc) => {
    const avgTemp = parseFloat(roomTemperature) || parseFloat(calculateRoomTemperature()) || 23;
    const numCalculatedUuc = parseFloat(calculatedUuc);
    if (!isNaN(numCalculatedUuc) && !isNaN(avgTemp)) {
      const compensated = (0.00027 * (avgTemp - 23) + 1) * numCalculatedUuc;
      return compensated.toFixed(1);
    }
    return calculatedUuc;
  };

  const calculateRowValues = (rowData, template, rowIndex) => {
    const getDecimalPlaces = (val) => {
      if (val === undefined || val === null || val === 'NA' || isNaN(val)) return 3;
      const str = val.toString();
      const parts = str.split('.');
      return parts.length > 1 ? parts[1].length : 0;
    };
    
    const parsedValues = rowData.map((val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });

    const result = { average: '', error: '', repeatability: '', hysteresis: '' };

    if (template === 'observationes') {
      // Col 5 to 9 are the readings
      const readings = parsedValues.slice(5, 10);
      const validReadings = readings.filter((val, idx) => {
        return rowData[idx + 5] !== '' && !isNaN(val);
      });
      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(4)
        : '';

      const mode = rowData[1] || 'Measure';
      const singleReading = parsedValues[4];

      if (result.average !== '' && !isNaN(singleReading)) {
        if (mode.toLowerCase() === 'measure') {
          // Measure: singleReading is Master, average is UUC
          result.error = (parseFloat(result.average) - singleReading).toFixed(4);
        } else {
          // Source: singleReading is UUC, average is Master
          result.error = (singleReading - parseFloat(result.average)).toFixed(4);
        }
      }
    }
    else if (template === 'observationuc') {
      const obsValues = parsedValues.slice(5, 10).filter((val, idx) => {
        return rowData[idx + 5] !== '' && !isNaN(val);
      });
      result.average = obsValues.length
        ? (obsValues.reduce((sum, val) => sum + val, 0) / obsValues.length).toFixed(4)
        : '';

      const allPoints = [
        ...observations.filter(p => p && (p.mode || '').toLowerCase() === 'measure'),
        ...observations.filter(p => p && (p.mode || '').toLowerCase() === 'source')
      ];
      const point = allPoints[rowIndex];
      const isMeasure = (point?.mode || '').toLowerCase() === 'measure';
      const referenceVal = parsedValues[4];

      if (result.average !== '' && !isNaN(referenceVal)) {
        if (isMeasure) {
          result.error = (parseFloat(result.average) - referenceVal).toFixed(4);
        } else {
          result.error = (referenceVal - parseFloat(result.average)).toFixed(4);
        }
      }
    }
    else if (template === 'observationth') {
      const obsValues = parsedValues.slice(5, 10).filter((val, idx) => {
        return rowData[idx + 5] !== '' && !isNaN(val);
      });
      const calibPointId = selectedTableData?.calibrationPoints?.[rowIndex];
      const lcs = leastCountData[calibPointId];
      const rowType = rowData[1];
      let lc = 0.001;
      if (rowType === 'UUC') {
        lc = lcs?.uuc ?? 0.001;
      } else if (rowType === 'Master') {
        lc = lcs?.master ?? 0.001;
      }
      const decPlaces = getDecimalPlaces(lc);
      result.average = obsValues.length
        ? (obsValues.reduce((sum, val) => sum + val, 0) / obsValues.length).toFixed(decPlaces)
        : '';
    }
    else if (template === 'observationts') {
      const readings = parsedValues.slice(1, 9);
      const validReadings = readings.filter(val => val !== 0 && !isNaN(val));
      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(4)
        : '';
    } else if (template === 'observationwbn') {
      const wReadings = parsedValues.slice(2, 5).filter((val) => val !== 0 && !isNaN(val));
      result.average = wReadings.length
        ? (wReadings.reduce((sum, val) => sum + val, 0) / wReadings.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';

      const rReadings = parsedValues.slice(7, 12).filter((val) => val !== 0 && !isNaN(val));
      result.averageuucr = rReadings.length
        ? (rReadings.reduce((sum, val) => sum + val, 0) / rReadings.length).toFixed(3)
        : '';

      const eReadings = parsedValues.slice(13, 23).filter((val) => val !== 0 && !isNaN(val));
      if (eReadings.length > 0) {
        const max = Math.max(...eReadings);
        const min = Math.min(...eReadings);
        result.eccentricity = ((max - min) / 2).toFixed(3);
      } else {
        result.eccentricity = '';
      }
    } else if (template === 'observationdpg') {
      const m1 = parsedValues[3];
      const m2 = parsedValues[4];
      const m3 = parsedValues[5];
      const validReadings = [m1, m2, m3].filter((val) => val !== 0);

      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';

      const setPressureMaster = parsedValues[2];
      result.error = result.average && setPressureMaster
        ? (setPressureMaster - result.average).toFixed(2)
        : '';

      // Repeatability = |M3 - M1| (per legacy PHP abssubstractminus('maste2r', 'maste0r'))
      result.repeatability = (m1 !== 0 && m3 !== 0)
        ? Math.abs(m3 - m1).toFixed(2)
        : '';

      // Hysteresis = |M2 - M1| (per legacy PHP abssubstractminus('maste1r', 'maste0r'))
      result.hysteresis = (m1 !== 0 && m2 !== 0)
        ? Math.abs(m2 - m1).toFixed(2)
        : '';
    } else if (template === 'observationppg') {
      const m1 = parsedValues[3];
      const m2 = parsedValues[4];
      const m3 = parsedValues[5];
      const m4 = parsedValues[6];
      const m5 = parsedValues[7];
      const m6 = parsedValues[8];
      const validReadings = [m1, m2, m3, m4, m5, m6].filter((val) => val !== 0);

      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';

      const setPressureMaster = parsedValues[2];
      result.error = result.average && setPressureMaster
        ? (setPressureMaster - result.average).toFixed(2)
        : '';

      result.repeatability = validReadings.length
        ? ((Math.max(...validReadings) - Math.min(...validReadings)) / 2).toFixed(2)
        : '';

      result.hysteresis = validReadings.length
        ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(2)
        : '';
    } else if (template === 'observationdg') {
      // Set 1 Forward and Set 2 Forward
      const set1Forward = parsedValues[2]; // col 2
      const set2Forward = parsedValues[4]; // col 4

      // Set 1 Backward and Set 2 Backward
      const set1Backward = parsedValues[3]; // col 3
      const set2Backward = parsedValues[5]; // col 5

      // Nominal Value (Master Unit) - col 1
      const nominalValue = parsedValues[1];

      // Average Forward Reading = (Set1Forward + Set2Forward) / 2
      const avgForward = (set1Forward + set2Forward) / 2;
      result.averageForward = avgForward ? avgForward.toFixed(3) : '';

      // Average Backward Reading = (Set1Backward + Set2Backward) / 2
      const avgBackward = (set1Backward + set2Backward) / 2;
      result.averageBackward = avgBackward ? avgBackward.toFixed(3) : '';

      // Error Forward = Average Forward - Nominal Value
      result.errorForward = result.averageForward && nominalValue
        ? (avgForward - nominalValue).toFixed(3)
        : '';

      // Error Backward = Average Backward - Nominal Value
      result.errorBackward = result.averageBackward && nominalValue
        ? (avgBackward - nominalValue).toFixed(3)
        : '';

      // Hysterisis = Average Forward - Average Backward
      result.hysteresis = result.averageForward && result.averageBackward
        ? (avgForward - avgBackward).toFixed(3)
        : '';

      console.log('DG Calculation:', {
        set1Forward, set2Forward, set1Backward, set2Backward,
        nominalValue,
        averageForward: result.averageForward,
        averageBackward: result.averageBackward,
        errorForward: result.errorForward,
        errorBackward: result.errorBackward,
        hysteresis: result.hysteresis
      });
    } else if (template === 'observationmsr') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (nominalValue - parseFloat(result.average)).toFixed(3)
        : '';
    } else if (template === 'observationavg') {
      const m1 = parsedValues[3]; // M1 value
      const m2 = parsedValues[4]; // M2 value
      const validReadings = [m1, m2].filter((val) => val !== 0);

      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(3)
        : '';

      const setPressureMaster = parsedValues[2]; // SET PRESSURE ON UUC (MASTER UNIT)
      result.error = result.average && setPressureMaster
        ? (parseFloat(setPressureMaster) - parseFloat(result.average)).toFixed(3)
        : '';

      result.hysteresis = validReadings.length >= 2
        ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(3)
        : '';

      console.log('🔢 AVG Calculation:', {
        m1, m2, setPressureMaster,
        average: result.average,
        error: result.error,
        hysteresis: result.hysteresis
      });
    } else if (template === 'observationfg') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationhg') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationmg') {
      const m1 = parsedValues[3]; // M1 value
      const m2 = parsedValues[4]; // M2 value
      const validReadings = [m1, m2].filter((val) => val !== 0);

      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';

      const setPressureMaster = parsedValues[2]; // SET PRESSURE ON UUC (MASTER UNIT)
      result.error = result.average && setPressureMaster
        ? (parseFloat(setPressureMaster) - parseFloat(result.average)).toFixed(2)
        : '';

      result.hysteresis = validReadings.length >= 2
        ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(2)
        : '';

      console.log('🔢 MG Calculation:', {
        m1, m2, setPressureMaster,
        average: result.average,
        error: result.error,
        hysteresis: result.hysteresis
      });
    }
    else if (template === 'observationexm') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    }
    else if (template === 'observationrtdwi') {
      const rowType = rowData[2]; // 'UUC' or 'Master'

      if (rowType === 'UUC') {
        // UUC calculations: Calculate average and error from observations
        const observations = parsedValues.slice(5, 10).filter((val) => val !== 0);

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        result.error = '';
      } else if (rowType === 'Master') {
        // Master calculations remain the same
        const observations = parsedValues.slice(5, 10).filter((val) => val !== 0);
        const ambient = parsedValues[11] ? parseFloat(parsedValues[11]) : 0;

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        if (result.average) {
          result.correctedAverage = (parseFloat(result.average) + ambient).toFixed(3);
        } else {
          result.correctedAverage = '';
        }
      }
    }
    else if (template === 'observationmm') {
      const observations = parsedValues.slice(5, 10).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[4];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationodfm') {
      const observations = parsedValues.slice(3, 8).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[2];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(2)
        : '';
    } else if (template === 'observationapg') {
      const m1 = parsedValues[3];
      const m2 = parsedValues[4];
      const validReadings = [m1, m2].filter((val) => val !== 0);
      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';
      const setPressureBar = parsedValues[2];
      result.error = result.average && setPressureBar
        ? (result.average - setPressureBar).toFixed(2)
        : '';
      result.hysteresis = validReadings.length
        ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(2)
        : '';
    } else if (template === 'observationit') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationmt') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationctg') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(2)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (result.average - nominalValue).toFixed(2)
        : '';
    }
    else if (template === 'observationgtm') {
      const rowType = rowData[2];

      if (rowType === 'UUC') {
        // UUC calculations (unchanged)
        const observations = parsedValues.slice(6, 11).filter((val) => val !== 0);

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        result.error = ''; // Keep as is
      } else if (rowType === 'Master') {
        // Master calculations - ADD CONVERSION USING SENSITIVITY
        const observations = parsedValues.slice(6, 11).filter((val) => val !== 0);
        const sens = parseFloat(parsedValues[5]) || 0;  // Sensitivity Coefficient (col5), default 0

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        // Converted Average (°C): If col12 already has value (manual edit), use it; else Average (Ω) * Sensitivity
        const manualConverted = parseFloat(parsedValues[12]);
        result.convertedAverage = !isNaN(manualConverted) && manualConverted !== 0
          ? manualConverted.toFixed(3)
          : sens ? (parseFloat(result.average) * sens).toFixed(3) : result.average;
      }
    }
    else if (template === 'observationtm') {
      const uucObservations = parsedValues.slice(4, 14).filter(val => val !== 0);
      const masterObservations = parsedValues.slice(14, 24).filter(val => val !== 0);

      result.averageUUC = uucObservations.length
        ? (uucObservations.reduce((sum, val) => sum + val, 0) / uucObservations.length).toFixed(4)
        : '';

      result.averageMaster = masterObservations.length
        ? (masterObservations.reduce((sum, val) => sum + val, 0) / masterObservations.length).toFixed(4)
        : '';

      const uucAvgNum = parseFloat(result.averageUUC);
      const masterAvgNum = parseFloat(result.averageMaster);

      result.error = (!isNaN(uucAvgNum) && !isNaN(masterAvgNum))
        ? (uucAvgNum - masterAvgNum).toFixed(4)
        : '';
    }
    // ✅ DW calculation — must be top-level, NOT inside GTM branch
    else if (template === 'observationdw') {
      const s1 = parsedValues[4] || 0;
      const u1 = parsedValues[5] || 0;
      const u2 = parsedValues[6] || 0;
      const s2 = parsedValues[7] || 0;
      const SIGDIG = 100000000;

      if (parsedValues[4] !== 0 || parsedValues[5] !== 0 || parsedValues[6] !== 0 || parsedValues[7] !== 0) {
        // Formula: ∆m = {(U1-S1) + (U2-S2)} / 2  (matches PHP calculatedeltai)
        const tempa = Math.floor((u1 - s1) * SIGDIG) / SIGDIG;
        const tempb = Math.floor((u2 - s2) * SIGDIG) / SIGDIG;
        result.diff = (tempa + tempb) / 2;
      } else {
        result.diff = '';
      }
    }
    else if (template === 'observationutm') {
      Object.assign(result, calculateUtmValues(rowData, rowIndex));
    }
    else if (template === 'observationwb') {
      const weighingCount = selectedTableData?.weighingCount || 0;
      const repeatabilityCount = selectedTableData?.repeatabilityCount || 0;

      // Helper function to safely count decimal places from least count
      const getDecimalPlaces = (val) => {
        if (!val || val === 'NA') return 3;
        const str = val.toString();
        const parts = str.split('.');
        return parts.length > 1 ? parts[1].length : 0;
      };
      const decimalPlaces = getDecimalPlaces(instrument?.leastcount || '0.001');

      if (rowIndex < weighingCount) {
        // Weighing Process: readings in cols 2, 3, 4
        const readings = parsedValues.slice(2, 5).filter(val => val !== 0 && !isNaN(val));
        result.average = readings.length
          ? (readings.reduce((sum, val) => sum + val, 0) / readings.length).toFixed(decimalPlaces)
          : '';
        const nominal = parsedValues[1];
        result.error = result.average && nominal
          ? (parseFloat(result.average) - nominal).toFixed(decimalPlaces)
          : '';
      } else if (rowIndex < weighingCount + repeatabilityCount) {
        // Repeatability: readings in cols 1 to 10
        const readings = parsedValues.slice(1, 11).filter(val => val !== 0 && !isNaN(val));
        result.average = readings.length
          ? (readings.reduce((sum, val) => sum + val, 0) / readings.length).toFixed(decimalPlaces)
          : '';
      } else {
        // Eccentricity: readings in cols 1 to 10
        const readings = parsedValues.slice(1, 11).filter(val => val !== 0 && !isNaN(val));
        if (readings.length > 0) {
          const maxVal = Math.max(...readings);
          const minVal = Math.min(...readings);
          result.eccentricity = ((maxVal - minVal) / 2).toFixed(decimalPlaces);
        } else {
          result.eccentricity = '';
        }
      }
    }

    return result;
  };

  const createObservationRows = (observationData, template) => {
    if (!observationData)
      return {
        rows: [],
        hiddenInputs: { calibrationPoints: [], types: [], repeatables: [], values: [] },
      };

    let dataArray = [];
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];
    const rowMeta = [];

    if (Array.isArray(observationData)) {
      dataArray = observationData;
    } else if (typeof observationData === 'object' && observationData !== null) {
      if (observationData.data && Array.isArray(observationData.data)) {
        dataArray = observationData.data;
      } else if (observationData.points && Array.isArray(observationData.points)) {
        dataArray = observationData.points;
      } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
        dataArray = observationData.calibration_points;
      } else {
        dataArray = [observationData];
      }
    }

    const rows = [];

    if (template === 'observationcustom') {
      const layout = getCustomLayoutIndices(instrument);
      if (layout) {
        dataArray.forEach((point) => {
          if (!point) return;

          const row = Array(layout.totalCols).fill('');
          row[0] = point.sr_no?.toString() || '';
          if (layout.paramIdx !== -1) row[layout.paramIdx] = safeGetValue(point.parameter);
          if (layout.specIdx !== -1) row[layout.specIdx] = safeGetValue(point.specification);
          if (layout.setpointIdx !== -1) row[layout.setpointIdx] = safeGetValue(point.point);

          const masterVals = safeGetArray(point.master, layout.masterObsIndices.length);
          layout.masterObsIndices.forEach((idx, i) => row[idx] = safeGetValue(masterVals[i]));
          if (layout.avgMasterIdx !== -1) row[layout.avgMasterIdx] = safeGetValue(point.averagemaster);

          const uucVals = safeGetArray(point.uuc, layout.uucObsIndices.length);
          layout.uucObsIndices.forEach((idx, i) => row[idx] = safeGetValue(uucVals[i]));
          if (layout.avgUucIdx !== -1) row[layout.avgUucIdx] = safeGetValue(point.averageuuc);

          if (layout.errorIdx !== -1) row[layout.errorIdx] = safeGetValue(point.error);
          if (layout.remarkIdx !== -1) row[layout.remarkIdx] = safeGetValue(point.remark);

          rows.push(row);
          calibrationPoints.push(point.point_id?.toString() || '');
          types.push('uuc');
          repeatables.push('0');
          values.push(safeGetValue(point.point) || '0');
        });
      }
    } else if (template === 'observationwbn') {
      dataArray.forEach((point) => {
        if (!point) return;

        const wReadings = safeGetArray(point.observations, 3);
        while (wReadings.length < 3) wReadings.push('');

        const rReadings = safeGetArray(point.uucr, 5);
        while (rReadings.length < 5) rReadings.push('');

        const eReadings = safeGetArray(point.uuce, 10);
        while (eReadings.length < 10) eReadings.push('');

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point || point.point),
          ...wReadings.slice(0, 3).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
          ...rReadings.slice(0, 5).map(obs => safeGetValue(obs)),
          safeGetValue(point.averageuucr),
          ...eReadings.slice(0, 10).map(obs => safeGetValue(obs)),
          safeGetValue(point.eccentricity)
        ];

        while (row.length < 24) row.push('');
        rows.push(row);

        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || '3');
        values.push(safeGetValue(point.nominal_value || point.test_point || point.point) || '0');
      });
    } else if (template === 'observationdpg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc_value || obs.set_pressure_uuc),
          safeGetValue(obs.converted_uuc_value || obs.set_pressure_master),
          safeGetValue(obs.master_readings?.m1 || obs.m1),
          safeGetValue(obs.master_readings?.m2 || obs.m2),
          safeGetValue(obs.master_readings?.m3 || obs.m3),
          safeGetValue(obs.average_master || obs.mean),
          safeGetValue(obs.error),
          safeGetValue(obs.repeatability),
          safeGetValue(obs.hysterisis || obs.hysteresis),
        ];
        rows.push(row);
        calibrationPoints.push(obs.calibration_point_id?.toString() || '');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(obs.uuc_value || obs.set_pressure_uuc) || '0');
      });
    }
    else if (template === 'observationdg') {
      dataArray.forEach((point) => {
        if (!point) return;

        const row = [
          point.sr_no?.toString() || '',                       // 0: Sr No - FIXED
          safeGetValue(point.nominal_value_master),            // 1: Nominal Value (Master Unit) - FIXED
          safeGetValue(point.set1_forward),                    // 2: Set 1 Forward - FIXED
          safeGetValue(point.set1_backward),                   // 3: Set 1 Backward - FIXED
          safeGetValue(point.set2_forward),                    // 4: Set 2 Forward - FIXED
          safeGetValue(point.set2_backward),                   // 5: Set 2 Backward - FIXED
          safeGetValue(point.average_forward),                 // 6: Average Forward
          safeGetValue(point.average_backward),                // 7: Average Backward
          safeGetValue(point.error_forward),                   // 8: Error Forward
          safeGetValue(point.error_backward),                  // 9: Error Backward
          safeGetValue(point.hysterisis)                       // 10: Hysterisis
        ];

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || ''); // FIXED: Using point_id
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.nominal_value_master) || '0'); // FIXED
      });
    }
    else if (template === 'observationppg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc_value),
          safeGetValue(obs.converted_uuc_value),
          safeGetValue(obs.master_readings?.m1),
          safeGetValue(obs.master_readings?.m2),
          safeGetValue(obs.master_readings?.m3),
          safeGetValue(obs.master_readings?.m4),
          safeGetValue(obs.master_readings?.m5),
          safeGetValue(obs.master_readings?.m6),
          safeGetValue(obs.average_master),
          safeGetValue(obs.error),
          safeGetValue(obs.repeatability),
          safeGetValue(obs.hysterisis || obs.hysteresis),
        ];
        rows.push(row);
        calibrationPoints.push(obs.calibration_point_id?.toString() || '');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(obs.uuc_value) || '0');
      });
    } else if (template === 'observationmsr') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, 5);

        // Ensure we have exactly 5 observation values
        while (observations.length < 5) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.uuc_value),
          ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        console.log('✅ MSR Row created:', row);

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.uuc_value) || '0');
      });
    }
    else if (template === 'observationgtm') {
      dataArray.forEach((point) => {
        if (!point) return;

        const srNo = point.sr_no?.toString() || '';
        const setPoint = safeGetValue(point.set_point);
        const range = safeGetValue(point.range);

        // UUC Row
        const uucReadings = safeGetArray(point.uuc_values, 5);
        const uucRow = [
          srNo,                                           // 0: Sr. No.
          setPoint,                                       // 1: Set Point
          'UUC',                                         // 2: Value Of (static)
          range,                                         // 3: Range
          safeGetValue(point.unit),                      // 4: Unit
          '-',                                           // 5: Sensitivity Coefficient (dash for UUC)
          ...uucReadings.slice(0, 5).map(val => safeGetValue(val)), // 6-10: Observations 1-5
          '-',                                            // 11: Average (Ω) - dash for UUC
          safeGetValue(point.average_uuc),               // 12: Average (°C) - CALCULATED
          safeGetValue(point.error),                     // 13: Deviation (°C) - CALCULATED from UUC avg
        ];
        rows.push(uucRow);
        calibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || "1");
        types.push('uuc');
        repeatables.push('1');
        values.push(setPoint || "0");

        // Master Row
        const masterReadings = safeGetArray(point.master_values, 5);
        const masterRow = [
          '-',                                           // 0: Sr. No. (dash)
          '-',                                           // 1: Set Point (dash)
          'Master',                                      // 2: Value Of (static)
          '-',                                           // 3: Range (dash)
          'UNIT_SELECT',                                 // 4: Unit (ReactSelect marker)
          safeGetValue(point.sensitivity_coefficient),   // 5: Sensitivity Coefficient
          ...masterReadings.slice(0, 5).map(val => safeGetValue(val)), // 6-10: Observations 1-5
          safeGetValue(point.average_master),            // 11: Average (Ω) - EDITABLE
          safeGetValue(point.converted_average_master),  // 12: Average (°C) - EDITABLE
          '-',                                           // 13: Deviation (°C) - dash for Master
        ];
        rows.push(masterRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('master');
        repeatables.push('1');
        values.push(setPoint || "0");
      });
    }
    else if (template === 'observationtm') {
      dataArray.forEach((point) => {
        if (!point) return;

        const srNo = point.sr_no?.toString() || '';
        const parameter = safeGetValue(point.parameter || point.unittype);
        const setPoint = safeGetValue(point.point || point.nominal_value || point.nominal_set_value);
        const range = safeGetValue(point.range);

        // UUC Row and Master Row flattened for custom rendering
        const uucReadings = safeGetArray(point.uuc_values || point.observations || point.uuc_observations, 10);
        const masterReadings = safeGetArray(point.master_values || point.master_observations, 10);

        const row = [
          srNo,                                            // 0: Sr. No.
          parameter,                                       // 1: Parameter
          setPoint,                                        // 2: Set Point
          range,                                           // 3: Range
          ...uucReadings.slice(0, 10).map(val => safeGetValue(val)),     // 4-13: UUC Observations 1-10
          ...masterReadings.slice(0, 10).map(val => safeGetValue(val)),  // 14-23: Master Observations 1-10
          safeGetValue(point.average_uuc),                 // 24: Average UUC
          safeGetValue(point.error_uuc || point.error),    // 25: Error
          safeGetValue(point.average_master)               // 26: Average Master
        ];
        rows.push(row);
        calibrationPoints.push(
          point.calibration_point_id?.toString() ||
          point.point_id?.toString() ||
          point.id?.toString() ||
          "1"
        );
        types.push('uuc');
        repeatables.push('0');
        values.push(range || "0");
      });
    }
    else if (template === 'observationavg') {
      dataArray.forEach((point) => {
        if (!point) return;

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.set_point_uuc),
          safeGetValue(point.calculated_uuc),
          safeGetValue(point.master_readings?.[0]),
          safeGetValue(point.master_readings?.[1]),
          safeGetValue(point.average_master),
          safeGetValue(point.error),
          safeGetValue(point.hysteresis),
        ];

        console.log('✅ AVG Row created:', row);

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.set_point_uuc) || '0');
      });
    }
    else if (observationTemplate === 'observationrtdwi') {
      let pointsToProcess = [];

      if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
        pointsToProcess = observationData.calibration_points;
      } else if (dataArray.length > 0) {
        pointsToProcess = dataArray;
      }

      pointsToProcess.forEach((point) => {
        if (!point) return;

        const srNo = point.sr_no?.toString() || '';
        const setPoint = safeGetValue(point.set_point);

        // UUC Row
        const uucReadings = safeGetArray(point.uuc_values, 5);
        const uucRow = [
          srNo,                                           // 0: Sr. No.
          setPoint,                                       // 1: Set Point
          'UUC',                                         // 2: Value Of
          safeGetValue(point.unit),                      // 3: Unit
          '-',                                           // 4: Sensitivity Coefficient
          ...uucReadings.slice(0, 5).map(val => safeGetValue(val)), // 5-9: Observations 1-5
          '-',                                            // 10: Average (dash for UUC)
          '-',                                            // 11: mV generated On ambient (dash for UUC)
          '-',                                            // 12: Average with corrected mv (dash for UUC)
          safeGetValue(point.average_uuc),               // 13: Average (°C) - CALCULATED
          safeGetValue(point.error),                     // 14: Deviation (°C) - EDITABLE (changed from dash)
        ];
        rows.push(uucRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('uuc');
        repeatables.push('1');
        values.push(setPoint || "0");

        // Master Row
        const masterReadings = safeGetArray(point.master_values, 5);
        const masterRow = [
          '-',                                           // 0: Sr. No.
          '-',                                           // 1: Set Point
          'Master',                                      // 2: Value Of
          'UNIT_SELECT',                                 // 3: Unit (ReactSelect marker)
          safeGetValue(point.sensitivity_coefficient),   // 4: Sensitivity Coefficient
          ...masterReadings.slice(0, 5).map(val => safeGetValue(val)), // 5-9: Observations 1-5
          safeGetValue(point.average_master),            // 10: Average (mV) - EDITABLE
          safeGetValue(point.ambient_master),            // 11: mV generated On ambient (EDITABLE)
          safeGetValue(point.s_average_master),          // 12: Average with corrected mv (CALCULATED)
          safeGetValue(point.c_average_master),          // 13: Average (°C) - MOVED HERE
          '-',                                           // 14: Deviation (°C) (dash for Master)
        ];
        rows.push(masterRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('master');
        repeatables.push('1');
        values.push(setPoint || "0");
      });
    } else if (template === 'observationth') {
      dataArray.forEach((point) => {
        if (!point) return;

        const srNo = point.sr_no?.toString() || '';
        const calibPointId = point.calibration_point_id?.toString() || point.point_id?.toString() || "1";
        const range = safeGetValue(point.value_shown_on?.uuc?.range || point.uucrange || point.range);
        const setPoint = safeGetValue(point.value_shown_on?.uuc?.nominal_value || point.set_point || point.nominal_value || point.point);
        const uucUnit = safeGetValue(point.value_shown_on?.uuc?.unit || point.unit);
        const masterUnit = safeGetValue(point.value_shown_on?.master?.unit || point.unit);

        // UUC Row
        const uucReadings = safeGetArray(point.value_shown_on?.uuc?.observations || point.uuc_values || point.observations || point.uuc_observations, 5);
        const uucRow = [
          srNo,
          'UUC',
          range,
          setPoint,
          uucUnit,
          ...uucReadings.slice(0, 5).map(obs => safeGetValue(obs.value !== undefined ? obs.value : obs)),
          safeGetValue(point.value_shown_on?.uuc?.average || point.average_uuc || point.averageuuc || point.average),
          '-'
        ];
        
        while(uucRow.length < 12) uucRow.push('');
        rows.push(uucRow);
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(setPoint || '0');

        // Master Row
        const masterReadings = safeGetArray(point.value_shown_on?.master?.observations || point.master_values || point.master_observations, 5);
        const masterRow = [
          '-',
          'Master',
          '-',
          '-',
          masterUnit,
          ...masterReadings.slice(0, 5).map(obs => safeGetValue(obs.value !== undefined ? obs.value : obs)),
          safeGetValue(point.value_shown_on?.master?.average || point.average_master || point.averagemaster),
          safeGetValue(point.error)
        ];
        
        while(masterRow.length < 12) masterRow.push('');
        rows.push(masterRow);
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(setPoint || '0');
      });
    }
    else if (template === 'observationmg') {
      dataArray.forEach((point) => {
        if (!point) return;

        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.set_pressure?.uuc_value || point.uuc_value),
          safeGetValue(point.set_pressure?.converted_value || point.converted_uuc_value || point.set_pressure?.uuc_value), // Use uuc_value if converted_value is null
          safeGetValue(point.observations?.master_1 || point.m1),
          safeGetValue(point.observations?.master_2 || point.m2),
          safeGetValue(point.calculations?.mean || point.mean || point.average_master),
          safeGetValue(point.calculations?.error || point.error),
          safeGetValue(point.calculations?.hysteresis || point.hysterisis || point.hysteresis),
        ];

        console.log('✅ MG Row created:', row);

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || point.calibration_point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.set_pressure?.uuc_value || point.uuc_value) || '0');
      });
    }

    else if (template === 'observationfg') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, 5);

        // Ensure we have exactly 5 observation values
        while (observations.length < 5) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        console.log('✅ FG Row created:', row);

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }

    else if (template === 'observationmm') {
      console.log('🔄 Creating MM observation rows from:', dataArray);

      // For MM, we need to handle multiple unit types
      const allRows = [];
      const allCalibrationPoints = [];
      const allTypes = [];
      const allRepeatables = [];
      const allValues = [];

      // Store unit types for rendering
      const unitTypes = [];

      dataArray.forEach((unitTypeGroup) => {
        if (!unitTypeGroup || !unitTypeGroup.calibration_points) return;

        console.log('📋 Processing MM unit type group:', unitTypeGroup.unit_type);

        // Store unit type info
        unitTypes.push(unitTypeGroup);

        unitTypeGroup.calibration_points.forEach((point, pointIndex) => {
          if (!point) return;

          // Extract observations safely
          const observations = [];
          if (point.observations && Array.isArray(point.observations)) {
            for (let i = 0; i < 5; i++) {
              observations.push(point.observations[i]?.value || '');
            }
          }

          // Ensure we have exactly 5 observations
          while (observations.length < 5) {
            observations.push('');
          }

          const row = [
            point.sequence_number?.toString() || (pointIndex + 1).toString(),
            point.mode || 'Measure',
            point.range || '',
            // Calculated master value with unit
            (point.nominal_values?.calculated_master?.value || '') +
            (point.nominal_values?.calculated_master?.unit ? ' ' + point.nominal_values.calculated_master.unit : ''),
            // Master value with unit
            (point.nominal_values?.master?.value || '') +
            (point.nominal_values?.master?.unit ? ' ' + point.nominal_values.master.unit : ''),
            ...observations,
            point.calculations?.average || '',
            point.calculations?.error || ''
          ];

          console.log(`✅ MM Row created for ${unitTypeGroup.unit_type}:`, row);

          allRows.push(row);
          allCalibrationPoints.push(point.point_id?.toString() || (allRows.length).toString());
          allTypes.push('input');
          allRepeatables.push('1');
          allValues.push(point.nominal_values?.master?.value || "0");
        });
      });

      console.log('📊 Final MM rows:', allRows.length, 'Unit Types:', unitTypes.length);

      // Return the structure with unit type information
      return {
        rows: allRows,
        hiddenInputs: {
          calibrationPoints: allCalibrationPoints,
          types: allTypes,
          repeatables: allRepeatables,
          values: allValues
        },
        unitTypes: unitTypes // This ensures all unit types are available
      };
    }


    else if (template === 'observationuc') {
      console.log('🔄 Creating UC observation rows from:', dataArray);

      const allRows = [];
      const allCalibrationPoints = [];
      const allTypes = [];
      const allRepeatables = [];
      const allValues = [];

      const modes = [];
      const measurePoints = dataArray.filter(p => p && (p.mode || '').toLowerCase() === 'measure');
      const sourcePoints = dataArray.filter(p => p && (p.mode || '').toLowerCase() === 'source');

      if (measurePoints.length > 0) {
        modes.push({ mode: 'Measure', calibration_points: measurePoints });
      }
      if (sourcePoints.length > 0) {
        modes.push({ mode: 'Source', calibration_points: sourcePoints });
      }

      const processPoints = (points) => {
        points.forEach((point) => {
          if (!point) return;

          const isMeasure = (point.mode || '').toLowerCase() === 'measure';

          const observations = [];
          const multiReadings = isMeasure
            ? (point.uuc_observations || point.uuc_values || point.observations || point.uuc_readings || [])
            : (point.master_observations || point.master_values || point.observations || point.master_readings || []);

          for (let i = 0; i < 5; i++) {
            observations.push(multiReadings[i]?.value ?? multiReadings[i] ?? '');
          }
          while (observations.length < 5) {
            observations.push('');
          }

          const average = isMeasure
            ? (point.averageuuc || point.average_uuc || '')
            : (point.averagemaster || point.average_master || '');

          const singleCalculated = isMeasure
            ? (point.calculatedmaster || point.calculated_master || point.nominal_values?.calculated_master?.value || point.nominal_set_value_on_master_calculated || '')
            : (point.calculateduuc || point.calculated_uuc || point.nominal_values?.calculated_uuc?.value || point.nominal_set_value_on_uuc_calculated || '');

          const singleReference = isMeasure
            ? (point.master || point.nominal_values?.master?.value || point.point || point.master_value || '')
            : (point.uuc || point.nominal_values?.uuc?.value || point.point || point.uuc_value || '');

          const row = [
            point.sequence_number?.toString() || point.sr_no?.toString() || (allRows.length + 1).toString(),
            point.unit_type || point.unittype || point.parameter || '',
            point.range || '',
            singleCalculated,
            singleReference,
            ...observations,
            average,
            point.error || ''
          ];

          allRows.push(row);
          allCalibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString() || (allRows.length).toString());
          allTypes.push('input');
          allRepeatables.push('5');
          allValues.push(singleReference || '0');
        });
      };

      if (measurePoints.length > 0) processPoints(measurePoints);
      if (sourcePoints.length > 0) processPoints(sourcePoints);

      return {
        rows: allRows,
        hiddenInputs: {
          calibrationPoints: allCalibrationPoints,
          types: allTypes,
          repeatables: allRepeatables,
          values: allValues
        },
        modes: modes
      };
    }
    else if (template === 'observationes') {
      console.log('🔄 Creating ES observation rows from:', dataArray);

      const allRows = [];
      const allCalibrationPoints = [];
      const allTypes = [];
      const allRepeatables = [];
      const allValues = [];
      const unitTypes = [];

      dataArray.forEach((item, pointIndex) => {
        if (!item) return;

        // If it comes wrapped in unitTypeGroup (legacy), extract it
        if (item.calibration_points && Array.isArray(item.calibration_points)) {
          unitTypes.push(item);
          item.calibration_points.forEach((p, pIdx) => processPoint(p, pIdx));
        } else {
          processPoint(item, pointIndex);
        }

        function processPoint(point, idx) {
          if (!point) return;

          const isMeasure = (point.mode || '').toLowerCase() === 'measure';

          let singleReading = '';
          let multiReadings = [];

          if (isMeasure) {
            singleReading = point.master_readings?.[0] ?? point.nominal_values?.master?.value ?? '';
            multiReadings = point.uuc_readings || point.observations || [];
          } else {
            singleReading = point.uuc_readings?.[0] ?? point.nominal_values?.uuc?.value ?? '';
            multiReadings = point.master_readings || point.observations || [];
          }

          const obsValues = [];
          for (let i = 0; i < 5; i++) {
            obsValues.push(multiReadings[i]?.value ?? multiReadings[i] ?? '');
          }

          const average = isMeasure ? point.average_uuc : point.average_master;

          const row = [
            point.sequence_number?.toString() || (idx + 1).toString(),
            point.mode || 'Measure',
            point.parameter || point.unittype || '', // Col 2: Parameter
            point.setpoint || point.range || point.point || point.test_point || '', // Col 3: Set Point
            singleReading, // Col 4: Single unit reading
            ...obsValues, // Col 5-9: Multiple unit readings
            average ?? point.calculations?.average ?? '', // Col 10: Average
            point.deviation_error ?? point.calculations?.error ?? '', // Col 11: Deviation/Error
            point.tolerance ?? point.specification ?? '' // Col 12: Tolerance
          ];

          allRows.push(row);
          allCalibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || (allRows.length).toString());
          allTypes.push('input');
          allRepeatables.push('1');
          allValues.push(row[3]); // Push set point as reference
        }
      });

      return {
        rows: allRows,
        hiddenInputs: {
          calibrationPoints: allCalibrationPoints,
          types: allTypes,
          repeatables: allRepeatables,
          values: allValues
        },
        unitTypes: unitTypes
      };
    }
    else if (template === 'observationexm') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, 5);

        // Ensure we have exactly 5 observation values
        while (observations.length < 5) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        console.log('✅ EXM Row created:', row);

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    } else if (template === 'observationhg') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, 5);

        // Ensure we have exactly 5 observation values
        while (observations.length < 5) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        console.log('✅ HG Row created:', row);

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc'); // CHANGED: Using 'uuc' type as requested
        repeatables.push(point.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }
    else if (template === 'observationodfm') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, 5);
        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.range),
          safeGetValue(point.nominal_value || point.uuc_value),
          ...observations.slice(0, 5).map((obs) => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        rows.push(row);
        // Use point_id from the API response
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.metadata?.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.uuc_value) || '0');
      });
    } else if (template === 'observationapg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc),
          safeGetValue(obs.calculated_uuc),
          safeGetValue(obs.m1),
          safeGetValue(obs.m2),
          safeGetValue(obs.mean),
          safeGetValue(obs.error),
          safeGetValue(obs.hysterisis),
        ];
        rows.push(row);
        calibrationPoints.push(obs.calibration_point_id?.toString() || '');
        types.push('input');
        repeatables.push('1');
        values.push(safeGetValue(obs.uuc) || '0');
      });
    } else if (template === 'observationit') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, 5);
        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        while (row.length < 9) {
          row.push('');
        }
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }
    else if (template === 'observationmt') {
      dataArray.forEach((point) => {
        if (!point) return;

        const observations = safeGetArray(point.observations, 5);
        const repeatableCycle = parseInt(point.repeatable_cycle || point.repeatablecycle, 10) || 5;

        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.uuc_value || point.nominal_value || point.test_point),
          ...Array.from({ length: 5 }, (_, index) =>
            index < repeatableCycle ? safeGetValue(observations[index]) : ''
          ),
          safeGetValue(point.average_master || point.average),
          safeGetValue(point.error),
        ];

        while (row.length < 9) {
          row.push('');
        }

        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(repeatableCycle.toString());
        values.push(safeGetValue(point.uuc_value || point.nominal_value || point.test_point) || '0');
      });
    }


    else if (template === 'observationctg') {
      dataArray.forEach((point) => {
        const observations = safeGetArray(point?.observations, 5);
        const row = [
          point?.sr_no?.toString() || '',
          point?.nominal_value || '',
          ...observations.slice(0, 5).map((obs) => safeGetValue(obs)),
          safeGetValue(point?.average),
          safeGetValue(point?.error),
        ];
        rows.push(row);
        calibrationPoints.push(point?.id?.toString() || ''); // ✅ IMPORTANT: Use point.id
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(point?.nominal_value) || '0');
      });
    } else if (template === 'observationdw') {
      dataArray.forEach((point) => {
        if (!point) return;
        const cycles = point.repeatable_cycle ? parseInt(point.repeatable_cycle) : 3;
        for (let cycle = 0; cycle < cycles; cycle++) {
          const row = [
            point.sr_no?.toString() || '',
            (cycle + 1).toString(),
            safeGetValue(point.nominal_value || point.test_point),
            safeGetValue(point.density),
            safeGetValue(point.s1?.[cycle]), // uuca -> S1
            safeGetValue(point.u1?.[cycle]), // mastera -> U1
            safeGetValue(point.u2?.[cycle]), // masterb -> U2
            safeGetValue(point.s2?.[cycle]), // uucb -> S2
            safeGetValue(point.deltai?.[cycle]), // Diff
            safeGetValue(point.average_diff), // Avg.Diff
          ];
          rows.push(row);
          calibrationPoints.push(point.point_id?.toString() || '');
          types.push('input'); // Will be overridden dynamically in handleSubmit
          repeatables.push(cycle.toString());
          values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
        }
      });
    } else if (template === 'observationts') {
      dataArray.forEach((point, pIndex) => {
        if (!point) return;
        const srNo = point.sr_no?.toString() || (pIndex + 1).toString();
        const calibPointId = point.point_id?.toString() || point.id?.toString() || point.calibration_point_id?.toString() || "1";

        for (let rc = 0; rc < 5; rc++) {
          const rowValues = [];
          for (let i = 0; i < 8; i++) {
            // Find observation for this specific row and column from API data
            let obsValue = '';
            if (point.observations && Array.isArray(point.observations)) {
              const obs = point.observations.find(o => o != null && String(o.repeatable) === `${rc}-${i}`);
              if (obs) obsValue = obs.value;
            }
            rowValues.push(safeGetValue(obsValue));
          }

          let avgValue = '';
          if (point.averages && Array.isArray(point.averages)) {
            const avg = point.averages.find(a => a != null && String(a.repeatable) === `${rc}`);
            if (avg) avgValue = avg.value;
          }

          const row = [
            rc === 0 ? srNo : '-', // Sr no
            ...rowValues, // 8 inputs
            safeGetValue(avgValue) // 1 average
          ];

          rows.push(row);
          calibrationPoints.push(calibPointId);
          types.push('uuc'); // Placeholder, handled in submit
          repeatables.push(rc.toString());
          values.push("0");
        }
      });
    } else if (template === 'observationutm') {
      const groups = normalizeUtmGroups(dataArray);

      groups.forEach((group, groupIndex) => {
        const matrixId = group.matrixId || `matrix-${groupIndex + 1}`;
        const leastCount = safeGetValue(group.leastCount);
        const numericPoints = group.calibrationPoints
          .map((point) => parseFloat(point?.point ?? point?.setpoint ?? point?.set_point ?? point?.test_point))
          .filter((point) => !isNaN(point));
        const minPoint = safeGetValue(group.minPoint ?? (numericPoints.length ? Math.min(...numericPoints) : ''));
        const maxPoint = safeGetValue(group.maxPoint ?? (numericPoints.length ? Math.max(...numericPoints) : ''));

        group.calibrationPoints.forEach((point, pointIndex) => {
          const pointId = safeGetValue(point?.point_id ?? point?.calibration_point_id ?? point?.id ?? '');
          const masterValues = [0, 1, 2].map((idx) => getObservationValueByType(point, 'master', idx));
          const calculatedUuc = getObservationValueByType(point, 'calculateduuc', 0);
          const rawUuc = getObservationValueByType(point, 'uuc', 0);
          // Apply temperature compensation to UUC value
          const compensatedUuc = rawUuc || applyTemperatureCompensation(calculatedUuc);
          const row = [
            point?.sr_no?.toString() || point?.sequence_number?.toString() || (pointIndex + 1).toString(),
            getObservationValueByType(point, 'setpoint', 0),
            calculatedUuc,
            compensatedUuc,
            ...masterValues,
            getObservationValueByType(point, 'averagemaster', 0),
            getObservationValueByType(point, 'error', 0),
            getObservationValueByType(point, 'percenterror', 0),
            getObservationValueByType(point, 'repeatability', 0),
          ];

          rows.push(row);
          calibrationPoints.push(pointId);
          types.push('setpoint');
          repeatables.push('0');
          values.push(row[1] || '0');
          rowMeta.push({
            kind: 'point',
            matrixId,
            matrixType: group.matrixType,
            minPoint,
            maxPoint,
            leastCount,
          });
        });

        const removalValues = [0, 1, 2].map((idx) => getObservationValueByType(group.raw, 'removalforce', idx));
        rows.push([
          group.matrixType ? `${group.matrixType} - Removal of force` : 'Observation Reading on Removal of force (fi0)',
          '',
          '',
          '',
          ...removalValues,
          '',
          '',
          '',
          '',
        ]);
        calibrationPoints.push(matrixId);
        types.push('removalforce');
        repeatables.push('0');
        values.push(removalValues[0] || '0');
        rowMeta.push({ kind: 'removal', matrixId, maxPoint });

        const zeroValues = [0, 1, 2].map((idx) => getObservationValueByType(group.raw, 'zeroerror', idx));
        rows.push([
          'Relative Zero Error % (f0)',
          '',
          '',
          '',
          ...zeroValues,
          '',
          '',
          '',
          '',
        ]);
        calibrationPoints.push(matrixId);
        types.push('zeroerror');
        repeatables.push('0');
        values.push(zeroValues[0] || '0');
        rowMeta.push({ kind: 'zeroerror', matrixId });

        const relativeResolution = getObservationValueByType(group.raw, 'releativeres', 0) ||
          (parseFloat(leastCount) && parseFloat(minPoint)
            ? ((parseFloat(leastCount) / parseFloat(minPoint)) * 100).toString()
            : '');
        rows.push([
          'Least count',
          leastCount,
          'Min Point',
          minPoint,
          'Max Relative Resolution',
          relativeResolution,
          '',
          '',
          '',
          '',
          '',
        ]);
        calibrationPoints.push(matrixId);
        types.push('releativeres');
        repeatables.push('0');
        values.push(relativeResolution || '0');
        rowMeta.push({ kind: 'relative', matrixId, leastCount, minPoint });

        rows.push([
          'Class of Machine',
          getObservationValueByType(group.raw, 'classofmachine', 0) || safeGetValue(group.classOfMachine),
          '',
          '',
          'Dial Gauge Setting',
          getObservationValueByType(group.raw, 'dialguageseting', 0) || safeGetValue(group.dialGaugeSetting),
          '',
          '',
          '',
          '',
          '',
        ]);
        calibrationPoints.push(matrixId);
        types.push('classofmachine');
        repeatables.push('0');
        values.push(rows[rows.length - 1][1] || '0');
        rowMeta.push({ kind: 'machine', matrixId });
      });
    } else if (template === 'observationwb') {
      const getObservationValue = (point, type, repeatable = 0) => {
        if (point.observations && Array.isArray(point.observations)) {
          const obs = point.observations.find(o => o.type === type && Number(o.repeatable) === repeatable);
          if (obs) return obs.value || '';
        }
        if (type === 'averageuuc' && point.averageuuc !== undefined) return point.averageuuc;
        if (type === 'averageuucr' && point.averageuucr !== undefined) return point.averageuucr;
        if (type === 'eccentricity' && point.eccentricity !== undefined) return point.eccentricity;
        if (type === 'error' && point.error !== undefined) return point.error;

        if (type === 'uuc' && point.uuc_values && Array.isArray(point.uuc_values)) {
          return point.uuc_values[repeatable] || '';
        }
        if (type === 'uucr' && point.uucr_values && Array.isArray(point.uucr_values)) {
          return point.uucr_values[repeatable] || '';
        }
        if (type === 'uuce' && point.uuce_values && Array.isArray(point.uuce_values)) {
          return point.uuce_values[repeatable] || '';
        }
        return '';
      };

      const weighingPoints = dataArray.filter(p => p.mode?.toLowerCase().includes('weighing') || p.mode_name?.toLowerCase().includes('weighing'));
      const repeatabilityPoints = dataArray.filter(p => p.mode?.toLowerCase().includes('repeatability') || p.mode_name?.toLowerCase().includes('repeatability'));
      const eccentricityPoints = dataArray.filter(p => p.mode?.toLowerCase().includes('eccentricity') || p.mode_name?.toLowerCase().includes('eccentricity'));

      // 1. Weighing Process
      weighingPoints.forEach((point, pIndex) => {
        const uucReadings = [];
        for (let i = 0; i < 3; i++) {
          uucReadings.push(getObservationValue(point, 'uuc', i));
        }
        const row = [
          (pIndex + 1).toString(), // Sr no
          safeGetValue(point.point || point.nominal_value), // Nominal Value
          ...uucReadings, // Readings 1, 2, 3
          getObservationValue(point, 'averageuuc', 0), // Average
          getObservationValue(point, 'error', 0), // Error
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || point.id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.point || point.nominal_value) || '0');
      });

      // 2. Repeatability
      repeatabilityPoints.forEach((point) => {
        const uucrReadings = [];
        for (let i = 0; i < 10; i++) {
          uucrReadings.push(getObservationValue(point, 'uucr', i));
        }
        const row = [
          safeGetValue(point.point || point.nominal_value), // Nominal Value
          ...uucrReadings, // Readings 1 to 10
          getObservationValue(point, 'averageuucr', 0), // Average
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || point.id?.toString() || '');
        types.push('uucr');
        repeatables.push('0');
        values.push('0');
      });

      // 3. Eccentricity
      eccentricityPoints.forEach((point) => {
        const uuceReadings = [];
        for (let i = 0; i < 10; i++) {
          uuceReadings.push(getObservationValue(point, 'uuce', i));
        }
        const row = [
          safeGetValue(point.point || point.nominal_value), // Nominal Value
          ...uuceReadings, // Readings 1 to 10
          getObservationValue(point, 'eccentricity', 0), // D=Ec (Max-Min)/2
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || point.id?.toString() || '');
        types.push('uuce');
        repeatables.push('0');
        values.push('0');
      });

      return {
        rows,
        hiddenInputs: { calibrationPoints, types, repeatables, values },
        weighingCount: weighingPoints.length,
        repeatabilityCount: repeatabilityPoints.length,
        eccentricityCount: eccentricityPoints.length,
      };
    }

    return {
      rows,
      hiddenInputs: { calibrationPoints, types, repeatables, values },
      rowMeta,
    };
  };

  const getCustomLayoutIndices = (instrument) => {
    if (!instrument) return null;
    let colIdx = 1;

    let hasParameter = instrument.parametertoshow === "Yes";
    let paramIdx = hasParameter ? colIdx++ : -1;

    let hasSpecification = instrument.specificationtoshow === "Yes";
    let specIdx = hasSpecification ? colIdx++ : -1;

    let hasSetpoint = instrument.setpointtoshow === "Yes";
    let setpointIdx = hasSetpoint ? colIdx++ : -1;

    let hasMaster = instrument.mastertoshow === "Yes";
    let masterCount = parseInt(instrument.master || 1);
    let hasUuc = instrument.uuctoshow === "Yes";
    let uucCount = parseInt(instrument.uuc || 1);

    let masterFirst = masterCount <= uucCount;

    let masterObsIndices = [];
    let avgMasterIdx = -1;
    let uucObsIndices = [];
    let avgUucIdx = -1;

    const pushMaster = () => {
      for (let i = 0; i < masterCount; i++) masterObsIndices.push(colIdx++);
      if (masterCount > 1) avgMasterIdx = colIdx++;
    };

    const pushUuc = () => {
      for (let i = 0; i < uucCount; i++) uucObsIndices.push(colIdx++);
      if (uucCount > 1) avgUucIdx = colIdx++;
    };

    if (hasMaster && masterFirst) pushMaster();
    if (hasUuc) pushUuc();
    if (hasMaster && !masterFirst) pushMaster();

    let hasError = instrument.errortoshow === "Yes";
    let errorIdx = hasError ? colIdx++ : -1;

    let hasRemark = instrument.remarktoshow === "Yes";
    let remarkIdx = hasRemark ? colIdx++ : -1;

    return {
      paramIdx, specIdx, setpointIdx,
      masterObsIndices, avgMasterIdx,
      uucObsIndices, avgUucIdx,
      errorIdx, remarkIdx,
      totalCols: colIdx
    };
  };

  const getObservationCustomStructure = (instrument) => {
    if (!instrument) {
      return { singleHeaders: [], subHeaders: {}, remainingHeaders: [] };
    }

    const singleHeaders = [];
    const subHeaders = {};
    const remainingHeaders = [];

    singleHeaders.push("Sr. No.");

    if (instrument.parametertoshow === "Yes") {
      singleHeaders.push(instrument.parameterheading || "Parameter");
    }

    if (instrument.specificationtoshow === "Yes") {
      singleHeaders.push(instrument.specificationheading || "Specification");
    }

    let masterdone = false;
    let uucdone = false;

    const masterCount = parseInt(instrument.master || 1);
    const uucCount = parseInt(instrument.uuc || 1);

    if (instrument.setpointtoshow === "Yes") {
      if (instrument.setpoint === "Separate") {
        singleHeaders.push(instrument.setpointheading || "Set Point");
      } else if (instrument.setpoint === "Master") {
        singleHeaders.push(instrument.masterheading || "Master");
        masterdone = true;
      } else if (instrument.setpoint === "UUC") {
        singleHeaders.push(instrument.uucheading || "UUC");
        uucdone = true;
      }
    }

    const addMasterObservations = () => {
      let obsArray = [];
      for (let i = 1; i <= masterCount; i++) obsArray.push(`Observation ${i}`);
      if (masterCount > 1) obsArray.push("Average On Master");

      subHeaders[instrument.masterheading || "Master Observations"] = obsArray;
      masterdone = true;
    };

    const addUucObservations = () => {
      let obsArray = [];
      for (let i = 1; i <= uucCount; i++) obsArray.push(`Observation ${i}`);
      if (uucCount > 1) obsArray.push("Average On UUC");

      subHeaders[instrument.uucheading || "UUC Observations"] = obsArray;
      uucdone = true;
    };

    if (instrument.mastertoshow === "Yes" && !masterdone && masterCount <= uucCount) {
      addMasterObservations();
    }

    if (instrument.uuctoshow === "Yes" && !uucdone) {
      addUucObservations();
    }

    if (instrument.mastertoshow === "Yes" && !masterdone) {
      addMasterObservations();
    }

    if (instrument.errortoshow === "Yes") {
      remainingHeaders.push("Error");
    }

    if (instrument.remarktoshow === "Yes") {
      remainingHeaders.push(instrument.remarkheading || "Remark");
    }

    return {
      singleHeaders,
      subHeaders,
      remainingHeaders
    };
  };

  const observationTables = [
    (() => {
      const { rows, hiddenInputs } = createObservationRows(observations, 'observationth');
      return {
        id: 'observationth',
        name: 'Observation TH',
        category: 'Thermohydrometer',
        structure: {
          singleHeaders: ['Sr no', 'Value Shown on', 'Range', 'nominal Value', 'Unit'],
          subHeaders: {
            'Observation on UUC / Master': ['1', '2', '3', '4', '5']
          },
          remainingHeaders: ['Mean', 'Error']
        },
        staticRows: rows,
        hiddenInputs: hiddenInputs
      };
    })(),
    {
      id: 'observationcustom',
      name: 'Observation Custom',
      category: 'Custom',
      structure: getObservationCustomStructure(instrument),
      staticRows: createObservationRows(observations, 'observationcustom').rows,
      hiddenInputs: createObservationRows(observations, 'observationcustom').hiddenInputs,
      modes: createObservationRows(observations, 'observationcustom').modes
    },
    {
      id: 'observationwbn',
      name: 'Observation WBN (Weighing, Rep, Ecc)',
      category: 'Weighing Balance',
      structure: {
        singleHeaders: ['Sr. No.', 'Nominal Value'],
        subHeaders: {
          'Weighing Process': ['W1', 'W2', 'W3', 'W-Avg', 'Error'],
          'Repeatability': ['R1', 'R2', 'R3', 'R4', 'R5', 'R-Avg'],
          'Eccentricity CW': ['CW1', 'CW2', 'CW3', 'CW4', 'CW5'],
          'Eccentricity ACW': ['ACW1', 'ACW2', 'ACW3', 'ACW4', 'ACW5']
        },
        remainingHeaders: ['Ecc D']
      },
      staticRows: createObservationRows(observations, 'observationwbn').rows,
      hiddenInputs: createObservationRows(observations, 'observationwbn').hiddenInputs,
    },
    {
      id: 'observationuc',
      name: 'Observation UC',
      category: 'Uncertainty',
      structure: {
        singleHeaders: ['Sr. No.', 'Unit Type', 'Range', 'Nominal/ Set Value (Calculated)', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationuc').rows,
      hiddenInputs: createObservationRows(observations, 'observationuc').hiddenInputs,
      modes: createObservationRows(observations, 'observationuc').modes
    },
    {
      id: 'observationdw',
      name: 'Observation DW',
      category: 'Dead Weight',
      structure: {
        singleHeaders: [
          'Sr no',
          'cycle no',
          'Nominal Value Of UUC(g)',
          'Density of UUC Weight, ρr (g/cm³)'
        ],
        subHeaders: {
          'Measured mass value(gm)': ['S1(g)', 'U1(g)', 'U2(g)', 'S2(g)']
        },
        remainingHeaders: ['Diff.,∆m{(U1-S1)+U2-S2)}/2', 'Avg.Diff.(g)'],
      },
      staticRows: createObservationRows(observations, 'observationdw').rows,
      hiddenInputs: createObservationRows(observations, 'observationdw').hiddenInputs,
    },

    {
      id: 'observationts',
      name: 'Observation TS',
      category: 'Test Sieve',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr no'],
        subHeaders: {
          'Aperture Size on Warp Side (in µm/mm)': ['1', '2', '3', '4'],
          'Aperture Size on Weft Side (in µm/mm)': ['1', '2', '3', '4'],
        },
        remainingHeaders: ['Average Aperture'],
      },
      staticRows: createObservationRows(observations, 'observationts').rows,
      hiddenInputs: createObservationRows(observations, 'observationts').hiddenInputs,
    },
    {
      id: 'observationdpg',
      name: 'Observation DPG',
      category: 'Pressure',
      structure: {
        singleHeaders: [
          'SR NO',
          'SET PRESSURE ON UUC (CALCULATIONUNIT)',
          '[SET PRESSURE ON UUC (MASTERUNIT)]',
        ],
        subHeaders: {
          'OBSERVATION ON UUC': ['M1', 'M2', 'M3'],
        },
        remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
      },
      staticRows: createObservationRows(observations, 'observationdpg').rows,
      hiddenInputs: createObservationRows(observations, 'observationdpg').hiddenInputs,
    },
    {
      id: 'observationgtm',
      name: 'Observation GTM',
      category: 'Temperature',
      structure: {
        singleHeaders: ['Sr. No.', 'Set Point (°C)', 'Value Of', 'Range', 'Unit', 'Sensitivity Coefficient'],
        subHeaders: {
          'Observation': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average (Ω)', 'Average (°C)', 'Deviation (°C)']
      },
      staticRows: createObservationRows(observations, 'observationgtm').rows,
      hiddenInputs: createObservationRows(observations, 'observationgtm').hiddenInputs
    }, {
      id: 'observationtm',
      name: 'Observation TM',
      category: 'Temperature',
      structure: {
        singleHeaders: ['Sr. No.', 'Parameter', 'Nominal/ Set Value', 'Range', 'Value Shown on'],
        subHeaders: {
          'Observation': ['1&6', '2&7', '3&8', '4&9', '5&10']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationtm').rows,
      hiddenInputs: createObservationRows(observations, 'observationtm').hiddenInputs
    }, {
      id: 'observationdg',
      name: 'Observation DG',
      category: 'Digital Gauge',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr no', 'Nominal Value (Master Unit)'],
        subHeaders: {
          'Set 1': ['Set 1 Forward Reading', 'Set 1 Backward Reading'],
          'Set 2': ['Set 2 Forward Reading', 'Set 2 Backward Reading'],
          'Average (mm)': ['Average Forward Reading', 'Average Backward Reading'],
          'Error (mm)': ['Error Forward Reading', 'Error Backward Reading']
        },
        remainingHeaders: ['Hysterisis']
      },
      staticRows: createObservationRows(observations, 'observationdg').rows,
      hiddenInputs: createObservationRows(observations, 'observationdg').hiddenInputs
    },

    {
      id: 'observationmsr',
      name: 'Observation MSR',
      category: 'Measuring',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationmsr').rows,
      hiddenInputs: createObservationRows(observations, 'observationmsr').hiddenInputs
    },
    {
      id: 'observationrtdwi',
      name: 'Observation RTD WI',
      category: 'RTD',
      structure: {
        singleHeaders: ['Sr. No.', 'Set Point (°C)', 'Value Of', 'Unit', 'Sensitivity Coefficient'],
        subHeaders: {
          'Observation': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (°C)', 'Deviation (°C)'] // REORDERED
      },
      staticRows: createObservationRows(observations, 'observationrtdwi').rows,
      hiddenInputs: createObservationRows(observations, 'observationrtdwi').hiddenInputs
    }, {
      id: 'observationppg',
      name: 'Observation PPG',
      category: 'Pressure',
      structure: {
        singleHeaders: [
          'SR NO',
          'SET PRESSURE ON UUC (CALCULATIONUNIT)',
          '[SET PRESSURE ON UUC (MASTERUNIT)]',
        ],
        subHeaders: {
          'OBSERVATION ON UUC': ['M1 (↑)', 'M2 (↓)', 'M3 (↑)', 'M4 (↓)', 'M5 (↑)', 'M6 (↓)'],
        },
        remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
      },
      staticRows: createObservationRows(observations, 'observationppg').rows,
      hiddenInputs: createObservationRows(observations, 'observationppg').hiddenInputs,
    }, {
      id: 'observationavg',
      name: 'Observation AVG',
      category: 'Pressure',
      structure: {
        singleHeaders: [
          'Sr no',
          'Set Pressure on UUC (UUC Unit)',
          '[Set Pressure on UUC (Master Unit)]'
        ],
        subHeaders: {
          'Observation on Master': ['M1', 'M2']
        },
        remainingHeaders: [
          'Mean (Master Unit)',
          'Error (Master Unit)',
          'Hysteresis (Master Unit)'
        ]
      },
      staticRows: createObservationRows(observations, 'observationavg').rows,
      hiddenInputs: createObservationRows(observations, 'observationavg').hiddenInputs
    }, {
      id: 'observationhg',
      name: 'Observation HG',
      category: 'Height Gauge',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationhg').rows,
      hiddenInputs: createObservationRows(observations, 'observationhg').hiddenInputs
    },
    {
      id: 'observationfg',
      name: 'Observation FG',
      category: 'Force Gauge',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal Value'],
        subHeaders: {
          'Observation on UUC': [
            'Observation 1 (Master)',
            'Observation 2 (Master)',
            'Observation 3 (Master)',
            'Observation 4 (Master)',
            'Observation 5 (Master)'
          ]
        },
        remainingHeaders: ['Average (Master)', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationfg').rows,
      hiddenInputs: createObservationRows(observations, 'observationfg').hiddenInputs,
    },

    {
      id: 'observationmm',
      name: 'Observation MM',
      category: 'Multimeter',
      structure: {
        singleHeaders: ['Sr. No.', 'Mode', 'Range', 'Nominal/ Set Value on master (Calculated)', 'Nominal/ Set Value on master'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationmm').rows,
      hiddenInputs: createObservationRows(observations, 'observationmm').hiddenInputs,
      unitTypes: createObservationRows(observations, 'observationmm').unitTypes // Add this line
    }, {
      id: 'observationes',
      name: 'Observation ES',
      category: 'Medical/Electrical Safety',
      structure: {
        singleHeaders: ['Sr. No.', 'Mode', 'Parameter', 'Set Point', 'Reading (UUC/Master)'],
        subHeaders: {
          'Readings (Master/UUC)': ['Reading 1', 'Reading 2', 'Reading 3', 'Reading 4', 'Reading 5']
        },
        remainingHeaders: ['Average', 'Error', 'Tolerance']
      },
      staticRows: createObservationRows(observations, 'observationes').rows,
      hiddenInputs: createObservationRows(observations, 'observationes').hiddenInputs,
      unitTypes: createObservationRows(observations, 'observationes').unitTypes
    }, {
      id: 'observationexm',
      name: 'Observation EXM',
      category: 'External Micrometer',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationexm').rows,
      hiddenInputs: createObservationRows(observations, 'observationexm').hiddenInputs
    }, {
      id: 'observationmg',
      name: 'Observation MG',
      category: 'Manometer',
      structure: {
        singleHeaders: [
          'Sr no',
          'Set Pressure on UUC ([unit])',
          '[Set Pressure on UUC ([master unit])]'
        ],
        subHeaders: {
          'Observation on UUC': ['M1', 'M2']
        },
        remainingHeaders: [
          'Mean ([master unit])',
          'Error ([master unit])',
          'Hysterisis ([master unit])'
        ]
      },
      staticRows: createObservationRows(observations, 'observationmg').rows,
      hiddenInputs: createObservationRows(observations, 'observationmg').hiddenInputs,
    },
    {
      id: 'observationodfm',
      name: 'Observation ODFM',
      category: 'Flow Meter',
      structure: {
        singleHeaders: [
          'Sr. No.',
          'Range (UUC Unit)',
          'Nominal/ Set Value UUC (UUC Unit)',

        ],
        subHeaders: {
          'Observation on Master': [
            'Observation 1 (Master Unit)',
            'Observation 2 (Master Unit)',
            'Observation 3 (Master Unit)',
            'Observation 4 (Master Unit)',
            'Observation 5 (Master Unit)',
          ],
        },
        remainingHeaders: ['Average (Master Unit)',
          'Error (Master Unit)',],
      },
      staticRows: createObservationRows(observations, 'observationodfm').rows,
      hiddenInputs: createObservationRows(observations, 'observationodfm').hiddenInputs,
    },
    {
      id: 'observationapg',
      name: 'Observation APG',
      category: 'Pressure',
      structure: {
        singleHeaders: ['Sr no', 'Set Pressure on UUC (kg/cm²)', 'Set Pressure on UUC (bar)'],
        subHeaders: {
          'Observations on Master (bar)': ['M1', 'M2'],
        },
        remainingHeaders: ['Mean (bar)', 'Error (bar)', 'Hysterisis (bar)'],
      },
      staticRows: createObservationRows(observations, 'observationapg').rows,
      hiddenInputs: createObservationRows(observations, 'observationapg').hiddenInputs,
    }, {
      id: 'observationit',
      name: 'Observation IT',
      category: 'Internal Thread',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': [
            'Observation 1',
            'Observation 2',
            'Observation 3',
            'Observation 4',
            'Observation 5'
          ]
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationit').rows,
      hiddenInputs: createObservationRows(observations, 'observationit').hiddenInputs,
    }, {
      id: 'observationmt',
      name: 'Observation MT',
      category: 'Measuring Tool',
      structure: {
        thermalCoeff: true,
        additionalFields: ['Thickness of graduation Line'],
        singleHeaders: ['Sr. No.', 'Nominal Value in (mm)'],
        subHeaders: {
          'Observation on Master in (mm)': [
            'Observation 1',
            'Observation 2',
            'Observation 3',
            'Observation 4',
            'Observation 5'
          ]
        },
        remainingHeaders: ['Average in (mm)', 'Error in (mm)']
      },
      staticRows: createObservationRows(observations, 'observationmt').rows,
      hiddenInputs: createObservationRows(observations, 'observationmt').hiddenInputs,
    },
    {
      id: 'observationctg',
      name: 'Observation CTG',
      category: 'Temperature',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal Value'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'],
        },
        remainingHeaders: ['Average', 'Error'],
      },
      staticRows: createObservationRows(observations, 'observationctg').rows,
      hiddenInputs: createObservationRows(observations, 'observationctg').hiddenInputs,
    },
    {
      id: 'observationutm',
      name: 'Observation UTM',
      category: 'Force',
      structure: {
        singleHeaders: [
          'Sr. No.',
          'Force (F)',
          'Std. at 23/24 +/-1 C',
          `Std. at Room Temp (°C)${roomTemperature ? ` - ${roomTemperature}` : ''}`
        ],
        subHeaders: {
          'Observed (F)': ['Position 0° / Obs 1', 'Position 120° / Obs 2', 'Position 240° / Obs 3']
        },
        remainingHeaders: ['Mean (Fi)', 'Error (q)', '% Error (q)', '% Repeatability Error (q)']
      },
      staticRows: createObservationRows(observations, 'observationutm').rows,
      hiddenInputs: createObservationRows(observations, 'observationutm').hiddenInputs,
      rowMeta: createObservationRows(observations, 'observationutm').rowMeta,
    },
    {
      id: 'observationwb',
      name: 'Observation WB',
      category: 'Weighing Balance',
      structure: {
        weighing: {
          singleHeaders: ['Sr. No.', 'Nominal Value'],
          subHeaders: {
            'Reading': ['1', '2', '3']
          },
          remainingHeaders: ['Average', 'Error']
        },
        repeatability: {
          singleHeaders: ['Nominal Value'],
          subHeaders: {
            'Reading on uuc': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
          },
          remainingHeaders: ['Average']
        },
        eccentricity: {
          singleHeaders: ['Nominal Value'],
          subHeaders: {
            'Reading on Clockwise': ['1', '2', '3', '4', '5'],
            'Reading on Anticlockwise': ['1', '2', '3', '4', '5']
          },
          remainingHeaders: ['D=Ec (Max-Min)/2']
        }
      },
      staticRows: createObservationRows(observations, 'observationwb').rows,
      hiddenInputs: createObservationRows(observations, 'observationwb').hiddenInputs,
      weighingCount: createObservationRows(observations, 'observationwb').weighingCount,
      repeatabilityCount: createObservationRows(observations, 'observationwb').repeatabilityCount,
      eccentricityCount: createObservationRows(observations, 'observationwb').eccentricityCount,
    },
  ];

  const availableTables = observationTables.filter(
    (table) => observationTemplate && table.id === observationTemplate
  );

  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    if (observationTemplate && availableTables.length > 0) {
      setSelectedTable(observationTemplate);
    }
  }, [observationTemplate, availableTables.length]);

  const selectedTableData = availableTables.find((table) => table.id === selectedTable);

  const generateTableStructure = () => {
    if (!selectedTableData || !selectedTableData.structure) return null;

    const structure = selectedTableData.structure;
    const headers = [];
    const subHeadersRow = [];

    structure.singleHeaders.forEach((header) => {
      headers.push({ name: header, colspan: 1 });
      subHeadersRow.push(null);
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        headers.push({ name: groupName, colspan: subHeaders.length });
        subHeaders.forEach((subHeader) => {
          subHeadersRow.push(subHeader);
        });
      });
    }

    if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        headers.push({ name: header, colspan: 1 });
        subHeadersRow.push(null);
      });
    }

    return { headers, subHeadersRow };
  };

  const tableStructure = generateTableStructure();

  const handleInputChange = (rowIndex, colIndex, value) => {
    setTableInputValues((prev) => {
      const newValues = { ...prev };
      const key = `${rowIndex}-${colIndex}`;
      newValues[key] = value;


      // ✅ NEW: Real-time validation for observationmm
      if (selectedTableData.id === 'observationmm' && colIndex >= 5 && colIndex <= 9) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId] || 2;

        if (value.trim()) {
          const numValue = parseFloat(value);

          // Clear previous error
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          // Validate and set error if needed
          if (numValue < leastCount) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please enter a value with in leastcount ${leastCount}`
            }));
          } else if (numValue % leastCount !== 0) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please Enter Value divisible by ${leastCount}`
            }));
          }
        }
      }


      // ✅ NEW: Real-time validation for observationctg
      if (selectedTableData.id === 'observationctg' && colIndex >= 2 && colIndex <= 6) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId];

        if (leastCount && value.trim()) {
          const numValue = parseFloat(value);

          // Clear previous error
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          // Validate and set error if needed
          if (numValue < leastCount) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please enter a value with in leastcount ${leastCount}`
            }));
          } else if (numValue % leastCount !== 0) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please Enter Value divisible by ${leastCount}`
            }));
          }
        }
      }


      if (!selectedTableData.staticRows?.[rowIndex]) return newValues;
      const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return newValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

      // Update calculated values in real-time
      if (selectedTableData.id === 'observationmg') {
        newValues[`${rowIndex}-5`] = calculated.average;
        newValues[`${rowIndex}-6`] = calculated.error;
      } else if (selectedTableData.id === 'observationwbn') {
        newValues[`${rowIndex}-5`] = calculated.average;
        newValues[`${rowIndex}-6`] = calculated.error;
        newValues[`${rowIndex}-12`] = calculated.averageuucr;
        newValues[`${rowIndex}-23`] = calculated.eccentricity;
      }
      else if (selectedTableData.id === 'observationfg') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      } else if (selectedTableData.id === 'observationmsr') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationhg') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationtm') {
        newValues[`${rowIndex}-24`] = calculated.averageUUC;
        newValues[`${rowIndex}-25`] = calculated.error;
        newValues[`${rowIndex}-26`] = calculated.averageMaster;
      }
      else if (selectedTableData.id === 'observationth') {
        const rowType = rowData[1]; // Index 1 is 'Value Shown on' -> 'UUC' or 'Master'
        const calibPointId = selectedTableData?.calibrationPoints?.[rowIndex];
        const lcs = leastCountData[calibPointId];
        const getDecimalPlaces = (val) => {
          if (val === undefined || val === null || val === 'NA' || isNaN(val)) return 3;
          const str = val.toString();
          const parts = str.split('.');
          return parts.length > 1 ? parts[1].length : 0;
        };
        const errorlc = Math.max(getDecimalPlaces(lcs?.uuc ?? 0.001), getDecimalPlaces(lcs?.master ?? 0.001));

        if (rowType === 'UUC') {
          newValues[`${rowIndex}-10`] = calculated.average || '';

          const masterAvg = parseFloat(newValues[`${rowIndex + 1}-10`] ?? tableInputValues[`${rowIndex + 1}-10`]);
          const uucAvg = parseFloat(calculated.average);
          if (!isNaN(masterAvg) && !isNaN(uucAvg)) {
            // Error is calculated on Master row index 11
            newValues[`${rowIndex + 1}-11`] = (uucAvg - masterAvg).toFixed(errorlc);
          }
        } else if (rowType === 'Master') {
          newValues[`${rowIndex}-10`] = calculated.average || '';

          const masterAvg = parseFloat(calculated.average);
          const uucAvg = parseFloat(newValues[`${rowIndex - 1}-10`] ?? tableInputValues[`${rowIndex - 1}-10`]);

          if (!isNaN(masterAvg) && !isNaN(uucAvg)) {
            newValues[`${rowIndex}-11`] = (uucAvg - masterAvg).toFixed(errorlc);
          }
        }
      }
      else if (selectedTableData.id === 'observationrtdwi') {
        const rowType = rowData[2];

        if (rowType === 'UUC') {
          newValues[`${rowIndex}-13`] = calculated.average || '';

          const masterAvgC = parseFloat(newValues[`${rowIndex + 1}-13`] ?? tableInputValues[`${rowIndex + 1}-13`]);
          const uucAvg = parseFloat(calculated.average);
          if (!isNaN(masterAvgC) && !isNaN(uucAvg)) {
            newValues[`${rowIndex}-14`] = (uucAvg - masterAvgC).toFixed(3);
          }
        } else if (rowType === 'Master') {
          newValues[`${rowIndex}-10`] = calculated.average || '';
          newValues[`${rowIndex}-12`] = calculated.correctedAverage || '';

          const masterAvgC = colIndex === 13 ? parseFloat(value) : parseFloat(newValues[`${rowIndex}-13`] ?? tableInputValues[`${rowIndex}-13`]);
          const uucAvg = parseFloat(newValues[`${rowIndex - 1}-13`] ?? tableInputValues[`${rowIndex - 1}-13`]);

          if (!isNaN(masterAvgC) && !isNaN(uucAvg)) {
            newValues[`${rowIndex - 1}-14`] = (uucAvg - masterAvgC).toFixed(3);
          }
        }
      } else if (selectedTableData.id === 'observationdg') {
        // Real-time calculation for DG
        newValues[`${rowIndex}-6`] = calculated.averageForward;   // Average Forward
        newValues[`${rowIndex}-7`] = calculated.averageBackward;  // Average Backward
        newValues[`${rowIndex}-8`] = calculated.errorForward;     // Error Forward
        newValues[`${rowIndex}-9`] = calculated.errorBackward;    // Error Backward
        newValues[`${rowIndex}-10`] = calculated.hysteresis;      // Hysterisis
      }
      else if (selectedTableData.id === 'observationppg') {
        // PPG REAL-TIME CALCULATION UPDATE
        newValues[`${rowIndex}-9`] = calculated.average;
        newValues[`${rowIndex}-10`] = calculated.error;
        newValues[`${rowIndex}-11`] = calculated.repeatability;
        newValues[`${rowIndex}-12`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationavg') {
        newValues[`${rowIndex}-5`] = calculated.average;
        newValues[`${rowIndex}-6`] = calculated.error;
        newValues[`${rowIndex}-7`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationdpg') {
        newValues[`${rowIndex}-6`] = calculated.average;
        newValues[`${rowIndex}-7`] = calculated.error;
        newValues[`${rowIndex}-8`] = calculated.repeatability;
        newValues[`${rowIndex}-9`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationodfm') {
        newValues[`${rowIndex}-8`] = calculated.average;
        newValues[`${rowIndex}-9`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationapg') {
        newValues[`${rowIndex}-5`] = calculated.average;
        newValues[`${rowIndex}-6`] = calculated.error;
        newValues[`${rowIndex}-7`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationmm') {
        newValues[`${rowIndex}-10`] = calculated.average;
        newValues[`${rowIndex}-11`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationuc') {
        newValues[`${rowIndex}-10`] = calculated.average;
        newValues[`${rowIndex}-11`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationes') {
        // Col 1 is Mode, Col 4 is Single Unit, Col 5-9 are Multi Unit, Col 10 is Average, Col 11 is Error
        const isMeasure = (rowData[1] || '').toLowerCase() === 'measure';
        newValues[`${rowIndex}-10`] = calculated.average;

        // Error calculation
        const avg = parseFloat(calculated.average);
        const singleUnit = parseFloat(newValues[`${rowIndex}-4`] ?? tableInputValues[`${rowIndex}-4`] ?? rowData[4]);

        if (!isNaN(avg) && !isNaN(singleUnit)) {
          // If Measure: Error = Average(UUC) - Master
          // If Source: Error = UUC - Average(Master) -> equivalent to Col 4 - Col 10
          // Wait, PHP says substractminus(uuc, master).
          // Measure (UUC is multiple): avg - singleUnit
          // Source (UUC is single): singleUnit - avg
          newValues[`${rowIndex}-11`] = isMeasure ? (avg - singleUnit).toFixed(3) : (singleUnit - avg).toFixed(3);
        } else {
          newValues[`${rowIndex}-11`] = '';
        }
      }
      else if (selectedTableData.id === 'observationit') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationmt') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationctg') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationexm') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationutm') {
        const rowMeta = selectedTableData.rowMeta?.[rowIndex];
        if (rowMeta?.kind === 'point') {
          newValues[`${rowIndex}-7`] = calculated.average;
          newValues[`${rowIndex}-8`] = calculated.error;
          newValues[`${rowIndex}-9`] = calculated.percentError;
          newValues[`${rowIndex}-10`] = calculated.repeatability;
        } else if (rowMeta?.kind === 'removal') {
          const zeroRowIndex = selectedTableData.rowMeta?.findIndex(
            (meta) => meta.kind === 'zeroerror' && meta.matrixId === rowMeta.matrixId
          );
          if (zeroRowIndex >= 0) {
            [0, 1, 2].forEach((idx) => {
              newValues[`${zeroRowIndex}-${4 + idx}`] = calculated[`zero${idx}`] || '';
            });
          }
        }
      }

      else if (selectedTableData.id === 'observationwb') {
        const weighingCount = selectedTableData?.weighingCount || 0;
        const repeatabilityCount = selectedTableData?.repeatabilityCount || 0;

        if (rowIndex < weighingCount) {
          newValues[`${rowIndex}-5`] = calculated.average;
          newValues[`${rowIndex}-6`] = calculated.error;
        } else if (rowIndex < weighingCount + repeatabilityCount) {
          newValues[`${rowIndex}-11`] = calculated.average;
        } else {
          newValues[`${rowIndex}-11`] = calculated.eccentricity;
        }
      }

      else if (selectedTableData.id === 'observationdw') {
        newValues[`${rowIndex}-8`] = calculated.diff !== undefined ? calculated.diff : '';

        // Calculate Average Diff across all cycles for this calibration point
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        if (calibPointId) {
          let sumDiff = 0;
          let countDiff = 0;

          selectedTableData.staticRows.forEach((r, rIdx) => {
            if (selectedTableData.hiddenInputs?.calibrationPoints?.[rIdx] === calibPointId) {
              const rDiff = rIdx === rowIndex
                ? parseFloat(calculated.diff)
                : parseFloat(newValues[`${rIdx}-8`] ?? tableInputValues[`${rIdx}-8`]);

              if (!isNaN(rDiff)) {
                sumDiff += rDiff;
                countDiff++;
              }
            }
          });

          const avgDiff = countDiff > 0 ? (sumDiff / countDiff).toFixed(5) : '';

          // Apply this average diff to all rows of this calibration point
          selectedTableData.staticRows.forEach((r, rIdx) => {
            if (selectedTableData.hiddenInputs?.calibrationPoints?.[rIdx] === calibPointId) {
              newValues[`${rIdx}-9`] = avgDiff;
            }
          });
        }
      }

      else if (selectedTableData.id === 'observationgtm') {
        const rowType = rowData[2];

        if (rowType === 'UUC') {
          // Update UUC Average (°C) and Deviation (°C) in real-time
          newValues[`${rowIndex}-12`] = calculated.average || '';

          // ✅ NEW: Real-time deviation for UUC = average - masterConvertedAvg (treat missing master as 0)
          const masterRowIndex = rowIndex + 1;
          const masterConvertedAvg = parseFloat(tableInputValues[`${masterRowIndex}-12`] || '0') || 0;
          const uucAverageNum = parseFloat(calculated.average) || 0;
          const deviation = (uucAverageNum - masterConvertedAvg).toFixed(3);

          newValues[`${rowIndex}-13`] = deviation || '';

          console.log('🔄 GTM UUC Real-time Deviation:', {
            uucAverage: calculated.average,
            masterConvertedAvg,
            deviation,
            rowIndex,
            masterRowIndex,
            formula: `${uucAverageNum} - ${masterConvertedAvg} = ${deviation}`
          });
        } else if (rowType === 'Master') {
          // Master calculations (unchanged for observations/average)
          newValues[`${rowIndex}-11`] = calculated.average || '';
          newValues[`${rowIndex}-12`] = calculated.convertedAverage || '';

          // Real-time deviation calculation when Master col 12 (Average °C) changes
          if (colIndex === 12 && value) {
            const uucRowIndex = rowIndex - 1;

            if (uucRowIndex >= 0 && selectedTableData.staticRows[uucRowIndex]) {
              const uucRowData = selectedTableData.staticRows[uucRowIndex].map((cell, idx) => {
                const inputKey = `${uucRowIndex}-${idx}`;
                return newValues[inputKey] ?? (cell?.toString() || '');
              });
              const uucAvgC = parseFloat(uucRowData[12]) || 0;

              if (uucAvgC > 0) {
                const deviation = (uucAvgC - parseFloat(value)).toFixed(3);

                newValues[`${uucRowIndex}-13`] = deviation;

                console.log('🔄 GTM Real-time Deviation (from Master Input Change):', {
                  uucAvgC,
                  masterConvertedAvg: value,
                  deviation,
                  uucRowIndex,
                  formula: `${uucAvgC} - ${value} = ${deviation}`
                });
              }
            }
          }
        }
      }

      return newValues;
    });
  };

  const handleObservationBlur = async (rowIndex, colIndex, value) => {
    const token = localStorage.getItem('authToken');
    const hiddenInputs = selectedTableData?.hiddenInputs || {
      calibrationPoints: [],
      types: [],
      repeatables: [],
      values: [],
    };

    const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];
    console.log('DEBUG handleObservationBlur:', { rowIndex, colIndex, value, id: selectedTableData?.id, calibrationPoints: hiddenInputs.calibrationPoints });
    if (!calibrationPointId) {
      toast.error('Calibration point ID not found');
      return;
    }

    const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
      const inputKey = `${rowIndex}-${idx}`;
      return tableInputValues[inputKey] ?? (cell?.toString() || '');
    });

    const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

    const payloads = [];

    if (selectedTableData.id === 'observationcustom') {
      const layout = getCustomLayoutIndices(instrument);
      if (layout) {
        if (layout.paramIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'parameter', repeatable: '0', value: rowData[layout.paramIdx] || '' });
        if (layout.specIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'specification', repeatable: '0', value: rowData[layout.specIdx] || '' });
        if (layout.setpointIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'setpoint', repeatable: '0', value: rowData[layout.setpointIdx] || '0' });

        layout.masterObsIndices.forEach((colIdx, i) => {
          payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'master', repeatable: i.toString(), value: rowData[colIdx] || '0' });
        });
        if (layout.avgMasterIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averagemaster', repeatable: '0', value: calculated.averagemaster || '0' });

        layout.uucObsIndices.forEach((colIdx, i) => {
          payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'uuc', repeatable: i.toString(), value: rowData[colIdx] || '0' });
        });
        if (layout.avgUucIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averageuuc', repeatable: '0', value: calculated.averageuuc || '0' });

        if (layout.errorIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'error', repeatable: '0', value: calculated.error || '0' });
        if (layout.remarkIdx !== -1) payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'remark', repeatable: '0', value: rowData[layout.remarkIdx] || '' });
      }

      setTableInputValues(prev => {
        const updated = { ...prev };
        if (layout) {
          if (layout.avgMasterIdx !== -1) updated[`${rowIndex}-${layout.avgMasterIdx}`] = calculated.averagemaster || '0';
          if (layout.avgUucIdx !== -1) updated[`${rowIndex}-${layout.avgUucIdx}`] = calculated.averageuuc || '0';
          if (layout.errorIdx !== -1) updated[`${rowIndex}-${layout.errorIdx}`] = calculated.error || '0';
        }
        return updated;
      });
    } else if (selectedTableData.id === 'observationts') {
      const rc = hiddenInputs.repeatables[rowIndex];
      for (let i = 0; i < 8; i++) {
        const colIdx = i + 1;
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: `${rc}-${i}`,
          value: rowData[colIdx] || '0',
        });
      }
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: rc.toString(),
        value: calculated.average || '0',
      });
    } else if (selectedTableData.id === 'observationdpg') {
      // DPG logic remains same
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      [3, 4, 5].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
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
        type: 'repeatability',
        repeatable: '0',
        value: calculated.repeatability || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: calculated.hysteresis || '0',
      });
    }

    else if (selectedTableData.id === 'observationdg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        // Nominal Value (Master Unit)
        type = 'master';
        repeatable = '0';
      } else if (colIndex === 2) {
        // Set 1 Forward
        type = 'masterinc';
        repeatable = '0';
      } else if (colIndex === 3) {
        // Set 1 Backward
        type = 'masterdec';
        repeatable = '0';
      } else if (colIndex === 4) {
        // Set 2 Forward
        type = 'masterinc';
        repeatable = '1';
      } else if (colIndex === 5) {
        // Set 2 Backward
        type = 'masterdec';
        repeatable = '1';
      } else {
        return; // Skip calculated fields (6-10)
      }

      // Save current field
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // When any Set value changes, save all calculated values
      if (colIndex >= 2 && colIndex <= 5) {
        // Average Forward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemasterinc',
          repeatable: '0',
          value: calculated.averageForward || '0',
        });

        // Average Backward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemasterdec',
          repeatable: '0',
          value: calculated.averageBackward || '0',
        });

        // Error Forward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'errorinc',
          repeatable: '0',
          value: calculated.errorForward || '0',
        });

        // Error Backward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'errordec',
          repeatable: '0',
          value: calculated.errorBackward || '0',
        });

        // Hysterisis
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'hysterisis',
          repeatable: '0',
          value: calculated.hysteresis || '0',
        });

        // Update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-6`]: calculated.averageForward || '0',
          [`${rowIndex}-7`]: calculated.averageBackward || '0',
          [`${rowIndex}-8`]: calculated.errorForward || '0',
          [`${rowIndex}-9`]: calculated.errorBackward || '0',
          [`${rowIndex}-10`]: calculated.hysteresis || '0',
        }));

        console.log('DG Real-time Update:', calculated);
      }
    }
    else if (selectedTableData.id === 'observationgtm') {
      const rowType = rowData[2];
      let type = '';
      let repeatable = '0';

      console.log('🔍 GTM Observation Blur:', { rowIndex, colIndex, value, rowType });

      if (rowType === 'UUC') {
        // UUC row handling
        if (colIndex === 1) {
          type = 'uuc';
          repeatable = '0';
        } else if (colIndex === 3) {
          type = 'range';
          repeatable = '0';
        } else if (colIndex === 4) {
          type = 'unit';
          repeatable = '0';
        } else if (colIndex >= 6 && colIndex <= 10) {
          type = 'uuc';
          repeatable = (colIndex - 6).toString();
        } else if (colIndex === 13) {
          // Allow manual editing of deviation
          type = 'error';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        // When UUC observations change (columns 6-10), calculate and save both average and error
        if (colIndex >= 6 && colIndex <= 10) {
          const obs1 = parseFloat(rowData[6]) || 0;
          const obs2 = parseFloat(rowData[7]) || 0;
          const obs3 = parseFloat(rowData[8]) || 0;
          const obs4 = parseFloat(rowData[9]) || 0;
          const obs5 = parseFloat(rowData[10]) || 0;

          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const average = validObservations.length
            ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
            : '';

          // Save Average (°C)
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'averageuuc',
            repeatable: '0',
            value: average || '0',
          });

          // FIXED: Build full master row data for correct Master's col 12
          const masterRowIndex = rowIndex + 1;
          let masterConvertedAvg = 0;
          if (masterRowIndex < selectedTableData.staticRows.length) {
            const masterRowData = selectedTableData.staticRows[masterRowIndex].map((cell, idx) => {
              const inputKey = `${masterRowIndex}-${idx}`;
              return tableInputValues[inputKey] ?? (cell?.toString() || '');
            });
            masterConvertedAvg = parseFloat(masterRowData[12]) || 0;  // Now correctly reads Master's Average (°C)
          }

          if (average) {
            const masterNum = masterConvertedAvg;
            const averageNum = parseFloat(average);
            const deviation = (averageNum - masterNum).toFixed(3);

            // Save Deviation (°C) for UUC
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: deviation || '0',
            });

            // Update UI immediately with CORRECT values
            setTableInputValues(prev => ({
              ...prev,
              [`${rowIndex}-12`]: average || '',
              [`${rowIndex}-13`]: deviation || '',
            }));

            console.log('✅ GTM UUC Blur Calculation (FIXED):', {
              average,
              masterConvertedAvg,  // Now correctly 232 (or whatever Master's col 12 is)
              deviation,  // Now correctly e.g., -229.600
              rowIndex,
              masterRowIndex,
              formula: `${averageNum} - ${masterNum} = ${deviation}`
            });
          } else {
            // If no average, set error to '0'
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: '0',
            });

            setTableInputValues(prev => ({
              ...prev,
              [`${rowIndex}-12`]: '',
              [`${rowIndex}-13`]: '0',
            }));
          }
        }
      } else if (rowType === 'Master') {
        // Master row handling
        if (colIndex === 4) {
          const selectedUnit = unitsList.find(u => u.label === value);
          type = 'masterunit';
          repeatable = '0';

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: selectedUnit?.value?.toString() || '0',
          });
          return;
        } else if (colIndex === 5) {
          type = 'sensitivitycoefficient';
          repeatable = '0';
        } else if (colIndex >= 6 && colIndex <= 10) {
          type = 'master';
          repeatable = (colIndex - 6).toString();
        } else if (colIndex === 11) {
          type = 'averagemaster';
          repeatable = '0';
        } else if (colIndex === 12) {
          // ✅ Manual edit of Average (°C) - maps to caveragemaster
          type = 'caveragemaster';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        // When master values change, recalculate and save
        if (colIndex >= 6 && colIndex <= 10 || colIndex === 11 || colIndex === 12) {
          const obs1 = parseFloat(rowData[6]) || 0;
          const obs2 = parseFloat(rowData[7]) || 0;
          const obs3 = parseFloat(rowData[8]) || 0;
          const obs4 = parseFloat(rowData[9]) || 0;
          const obs5 = parseFloat(rowData[10]) || 0;

          const manualAverage = parseFloat(rowData[11]) || 0;
          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const calculatedAverage = manualAverage > 0
            ? manualAverage.toFixed(3)
            : (validObservations.length
              ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
              : '');

          // ✅ Get converted average - use the value user just entered if they're editing column 12
          const convertedAverage = colIndex === 12 ? (parseFloat(value) || 0).toFixed(3) : (rowData[12] || calculatedAverage);

          // Save Average (Ω) only if not manually editing it
          if (colIndex !== 11) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averagemaster',
              repeatable: '0',
              value: calculatedAverage || '0',
            });
          }

          // ✅ Only save caveragemaster if we're not already saving it above
          if (colIndex !== 12) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'caveragemaster',
              repeatable: '0',
              value: convertedAverage || '0',
            });
          }

          // ✅ CRITICAL: Calculate and save UUC deviation when master caveragemaster changes
          const uucRowIndex = rowIndex - 1; // UUC row is before Master row
          const uucRowData = selectedTableData.staticRows[uucRowIndex]?.map((cell, idx) => {
            const inputKey = `${uucRowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          }) || [];

          const uucAvgC = parseFloat(uucRowData[12]) || 0;  // UUC Average (°C) - col 12

          console.log('🔍 GTM Master Change - Calculating UUC Deviation:', {
            uucRowIndex,
            uucAvgC,
            convertedAverage,
            colIndex
          });

          if (uucRowIndex >= 0 && uucAvgC > 0 && convertedAverage) {
            // ✅ Formula: UUC Average - Master Converted Average
            const deviation = (uucAvgC - parseFloat(convertedAverage)).toFixed(3);

            const uucCalibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[uucRowIndex];
            if (uucCalibPointId) {
              payloads.push({
                inwardid: inwardId,
                instid: instId,
                calibrationpoint: uucCalibPointId,
                type: 'error',
                repeatable: '0',
                value: deviation || '0',
              });

              // ✅ Update UUC deviation in UI immediately
              setTableInputValues(prev => ({
                ...prev,
                [`${uucRowIndex}-13`]: deviation || '',
              }));

              console.log('✅ GTM Deviation updated from Master change:', {
                uucAvgC,
                masterConvertedAvg: convertedAverage,
                deviation,
                formula: `${uucAvgC} - ${convertedAverage} = ${deviation}`
              });
            } else {
              console.warn('⚠️ No UUC calibration point ID found for deviation save');
            }
          } else if (uucAvgC === 0) {
            console.warn('⚠️ UUC Average (°C) is 0 - cannot calculate deviation yet');
          }

          // Update Master row UI
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-11`]: calculatedAverage || '',
            [`${rowIndex}-12`]: convertedAverage || '',
          }));
        }
      }

      // Send all payloads
      try {
        for (const payload of payloads) {
          console.log('📡 Sending GTM payload:', payload);
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

        console.log('✅ GTM observations saved successfully!');
        toast.success('Observation and calculated values saved successfully!');
        await refetchObservations();
      } catch (err) {
        console.error('❌ Error saving GTM observations:', err);
        toast.error(err.response?.data?.message || 'Failed to save GTM observations');
      }
      return;
    }

    else if (selectedTableData.id === 'observationrtdwi') {
      const rowType = rowData[2];
      let type = '';
      let repeatable = '0';

      if (rowType === 'UUC') {
        if (colIndex === 1) {
          type = 'uuc';
          repeatable = '0';
        } else if (colIndex === 3) {
          type = 'unit';
          repeatable = '0';
        } else if (colIndex === 4) {
          type = 'sensitivitycoefficient';
          repeatable = '0';
        } else if (colIndex >= 5 && colIndex <= 9) {
          type = 'uuc';
          repeatable = (colIndex - 5).toString();
        } else if (colIndex === 14) {
          // Allow saving deviation manually if needed
          type = 'error';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        // When observations change (columns 5-9), calculate and save both average and error
        if (colIndex >= 5 && colIndex <= 9) {
          const obs1 = parseFloat(rowData[5]) || 0;
          const obs2 = parseFloat(rowData[6]) || 0;
          const obs3 = parseFloat(rowData[7]) || 0;
          const obs4 = parseFloat(rowData[8]) || 0;
          const obs5 = parseFloat(rowData[9]) || 0;

          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const average = validObservations.length
            ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
            : '';

          // Save Average (°C)
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'averageuuc',
            repeatable: '0',
            value: average || '0',
          });

          // Save Deviation (°C) - same as average for UUC
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'error',
            repeatable: '0',
            value: average || '0',
          });

          // Update UI immediately
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-13`]: average || '',
            [`${rowIndex}-14`]: average || '',
          }));
        }
      } else if (rowType === 'Master') {
        // Master logic remains the same as before
        if (colIndex === 3) {
          const selectedUnit = unitsList.find(u => u.label === value);
          type = 'masterunit';
          repeatable = '0';

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: selectedUnit?.value?.toString() || '0',
          });
          return;
        } else if (colIndex >= 5 && colIndex <= 9) {
          type = 'master';
          repeatable = (colIndex - 5).toString();
        } else if (colIndex === 10) {
          type = 'averagemaster';
          repeatable = '0';
        } else if (colIndex === 11) {
          type = 'ambientmaster';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        if (colIndex >= 5 && colIndex <= 9 || colIndex === 10 || colIndex === 11) {
          const obs1 = parseFloat(rowData[5]) || 0;
          const obs2 = parseFloat(rowData[6]) || 0;
          const obs3 = parseFloat(rowData[7]) || 0;
          const obs4 = parseFloat(rowData[8]) || 0;
          const obs5 = parseFloat(rowData[9]) || 0;
          const ambient = parseFloat(rowData[11]) || 0;

          const manualAverage = parseFloat(rowData[10]) || 0;
          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const average = manualAverage > 0
            ? manualAverage.toFixed(3)
            : (validObservations.length
              ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
              : '');

          const correctedAverage = average && ambient
            ? (parseFloat(average) + ambient).toFixed(3)
            : average;

          if (colIndex !== 10) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averagemaster',
              repeatable: '0',
              value: average || '0',
            });
          }

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'saveragemaster',  // This is for column 12
            repeatable: '0',
            value: correctedAverage || '0',
          });

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'caveragemaster',
            repeatable: '0',
            value: average || '0',
          });

          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-10`]: average || '',
            [`${rowIndex}-12`]: correctedAverage || '',
            [`${rowIndex}-13`]: average || '',
          }));
        }
      }
    } else if (selectedTableData.id === 'observationth') {
      const isUUCRow = rowData[1] === 'UUC';
      const isMasterRow = rowData[1] === 'Master';
      let type = '';
      let repeatable = '0';

      if (isUUCRow) {
        if (colIndex === 2) {
          type = 'uucrange';
        } else if (colIndex === 3) {
          type = 'setpoint';
        } else if (colIndex >= 5 && colIndex <= 9) {
          type = 'uuc';
          repeatable = (colIndex - 4).toString();
        } else if (colIndex === 10) {
          type = 'averageuuc';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });
        // Force Vite reload
        if (colIndex >= 5 && colIndex <= 9) {
           payloads.push({
             inwardid: inwardId,
             instid: instId,
             calibrationpoint: calibrationPointId,
             type: 'averageuuc',
             repeatable: '0',
             value: calculated.average || '0',
           });
           
           const masterAvg = parseFloat(tableInputValues[`${rowIndex + 1}-10`]);
           const uucAvg = parseFloat(calculated.average);
           if (!isNaN(masterAvg) && !isNaN(uucAvg)) {
             payloads.push({
               inwardid: inwardId,
               instid: instId,
               calibrationpoint: calibrationPointId,
               type: 'error',
               repeatable: '0',
               value: (masterAvg - uucAvg).toFixed(4),
             });
           }
        }
      } else if (isMasterRow) {
        if (colIndex >= 5 && colIndex <= 9) {
          type = 'master';
          repeatable = (colIndex - 4).toString();
        } else if (colIndex === 10) {
          type = 'averagemaster';
        } else if (colIndex === 11) {
          type = 'error';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        if (colIndex >= 5 && colIndex <= 9) {
           payloads.push({
             inwardid: inwardId,
             instid: instId,
             calibrationpoint: calibrationPointId,
             type: 'averagemaster',
             repeatable: '0',
             value: calculated.average || '0',
           });

           const masterAvg = parseFloat(calculated.average);
           const uucAvg = parseFloat(tableInputValues[`${rowIndex - 1}-10`]);
           if (!isNaN(masterAvg) && !isNaN(uucAvg)) {
             payloads.push({
               inwardid: inwardId,
               instid: instId,
               calibrationpoint: calibrationPointId,
               type: 'error',
               repeatable: '0',
               value: (masterAvg - uucAvg).toFixed(4),
             });
           }
        }
      }
    }
    else if (selectedTableData.id === 'observationmsr') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        type = 'master'; // Changed from 'uuc' to 'master'
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      console.log('📡 MSR Observation Blur:', {
        rowIndex,
        colIndex,
        type,
        repeatable,
        value: value || '0',
        calibrationPointId
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= 6) {
        console.log('📊 MSR Calculated Values:', {
          average: calculated.average,
          error: calculated.error
        });

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

        // Update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }

      console.log('📤 MSR Payloads being sent:', payloads);
    }
    else if (selectedTableData.id === 'observationppg') {
      // COMPLETE PPG LOGIC
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
        repeatable = '0';
      } else if (colIndex === 2) {
        type = 'calculatedmaster';
        repeatable = '0';
      } else if (colIndex >= 3 && colIndex <= 8) {
        // M1-M6 observations (columns 3-8)
        type = 'master';
        repeatable = (colIndex - 3).toString(); // 0,1,2,3,4,5 for M1-M6
      } else {
        return; // Skip calculated fields (9,10,11,12)
      }

      // Save current field
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // When any M1-M6 value changes, save all calculated values
      if (colIndex >= 3 && colIndex <= 8) {
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
          type: 'repeatability',
          repeatable: '0',
          value: calculated.repeatability || '0',
        });
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'hysterisis',
          repeatable: '0',
          value: calculated.hysteresis || '0',
        });

        // Update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-9`]: calculated.average || '0',
          [`${rowIndex}-10`]: calculated.error || '0',
          [`${rowIndex}-11`]: calculated.repeatability || '0',
          [`${rowIndex}-12`]: calculated.hysteresis || '0',
        }));

        console.log('🔄 PPG Real-time Update:', {
          rowIndex,
          average: calculated.average,
          error: calculated.error,
          repeatability: calculated.repeatability,
          hysteresis: calculated.hysteresis
        });
      }
    } else if (selectedTableData.id === 'observationavg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
      } else if (colIndex === 2) {
        type = 'calculatedmaster';
      } else if (colIndex === 3) {
        type = 'master';
        repeatable = '0';
      } else if (colIndex === 4) {
        type = 'master';
        repeatable = '1';
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Real-time update of calculated values
      if (colIndex === 3 || colIndex === 4) {
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

        // Also update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-5`]: calculated.average || '0',
          [`${rowIndex}-6`]: calculated.error || '0',
          [`${rowIndex}-7`]: calculated.hysteresis || '0',
        }));
      }
    } else if (selectedTableData.id === 'observationhg') {
      let type = 'uuc'; // CHANGED: Using 'uuc' type as requested
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= 6) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averageuuc',
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

        // Also update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }
    } else if (selectedTableData.id === 'observationexm') {
      let type = 'uuc';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= 6) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averageuuc',
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

        // Also update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationfg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        type = 'master';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= 6) {
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

        // Also update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationit') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Changed to 'master' for nominal/set value to avoid conflict
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= 6) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averageuuc',
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
      }
    } else if (selectedTableData.id === 'observationmg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
      } else if (colIndex === 2) {
        type = 'calculatedmaster';
      } else if (colIndex === 3) {
        type = 'master';
        repeatable = '0';
      } else if (colIndex === 4) {
        type = 'master';
        repeatable = '1';
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Real-time update of calculated values - FIXED
      if (colIndex === 3 || colIndex === 4) {
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

        // Also update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-5`]: calculated.average || '0',
          [`${rowIndex}-6`]: calculated.error || '0',
          [`${rowIndex}-7`]: calculated.hysteresis || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationmm') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 2) {
        type = 'range';
      } else if (colIndex >= 5 && colIndex <= 9) {
        type = 'uuc';
        repeatable = (colIndex - 5).toString();
      } else {
        return; // Don't save other columns
      }

      // Find the correct calibration point ID for this row
      const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];
      if (!calibrationPointId) {
        toast.error('Calibration point ID not found');
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 5 && colIndex <= 9) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averageuuc',
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
      }
    } else if (selectedTableData.id === 'observationmt') {
      let type = 'master';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex], 10) || 5;
        if (colIndex >= 2 + repeatableCycle) return;
        type = 'master';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= 6) {
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
      }
    }
    else if (selectedTableData.id === 'observationtm') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 3) {
        type = 'range';
        repeatable = '0';
      } else if (colIndex >= 4 && colIndex <= 13) {
        type = 'uuc';
        repeatable = (colIndex - 4).toString();
      } else if (colIndex >= 14 && colIndex <= 23) {
        type = 'master';
        repeatable = (colIndex - 14).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Recalculate and save calculated values if observation changed
      if ((colIndex >= 4 && colIndex <= 13) || (colIndex >= 14 && colIndex <= 23)) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averageuuc',
          repeatable: '0',
          value: calculated.averageUUC || '0',
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
          type: 'averagemaster',
          repeatable: '0',
          value: calculated.averageMaster || '0',
        });

        // Update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-24`]: calculated.averageUUC || '0',
          [`${rowIndex}-25`]: calculated.error || '0',
          [`${rowIndex}-26`]: calculated.averageMaster || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationctg') {
      // Keep existing CTG logic - DON'T CHANGE
      let type = 'master'; // Changed to 'master' for nominal/set value to avoid conflict and for consistency
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master';
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      if (calculated.average) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averageuuc',
          repeatable: '0',
          value: calculated.average || '0',
        });
      }

      if (calculated.error) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'error',
          repeatable: '0',
          value: calculated.error || '0',
        });
      }
    }
    else if (selectedTableData.id === 'observationuc') {
      const allPoints = [
        ...observations.filter(p => p && (p.mode || '').toLowerCase() === 'measure'),
        ...observations.filter(p => p && (p.mode || '').toLowerCase() === 'source')
      ];
      const point = allPoints[rowIndex];
      const isMeasure = (point?.mode || '').toLowerCase() === 'measure';

      let type = '';
      let repeatable = '0';

      if (colIndex === 2) {
        type = 'range';
        repeatable = '0';
      } else if (colIndex === 3) {
        type = isMeasure ? 'calculatedmaster' : 'calculateduuc';
        repeatable = '0';
      } else if (colIndex === 4) {
        type = isMeasure ? 'master' : 'uuc';
        repeatable = '0';
      } else if (colIndex >= 5 && colIndex <= 9) {
        type = isMeasure ? 'uuc' : 'master';
        repeatable = (colIndex - 5).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      if ((colIndex >= 4 && colIndex <= 9) || colIndex === 3) {
        const avgType = isMeasure ? 'averageuuc' : 'averagemaster';

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: avgType,
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

        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-10`]: calculated.average || '0',
          [`${rowIndex}-11`]: calculated.error || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationes') {
      const isMeasure = (rowData[1] || '').toLowerCase() === 'measure';
      let type = '';
      let repeatable = '0';

      if (colIndex === 4) {
        // Col 4 is Single Unit
        type = isMeasure ? 'master' : 'uuc';
        repeatable = '0';
      } else if (colIndex >= 5 && colIndex <= 9) {
        // Col 5 to 9 are Multi Unit
        type = isMeasure ? 'uuc' : 'master';
        repeatable = (colIndex - 5).toString();
      } else if (colIndex === 12) {
        // Tolerance
        type = 'specification';
        repeatable = '0';
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      if (colIndex >= 4 && colIndex <= 9) {
        if (calculated.average) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: isMeasure ? 'averageuuc' : 'averagemaster',
            repeatable: '0',
            value: calculated.average || '0',
          });
        }
        if (calculated.error) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'error',
            repeatable: '0',
            value: calculated.error || '0',
          });
        }
      }
    }
    else if (selectedTableData.id === 'observationwb') {
      const weighingCount = selectedTableData?.weighingCount || 0;
      const repeatabilityCount = selectedTableData?.repeatabilityCount || 0;

      if (rowIndex < weighingCount) {
        // Weighing Process
        let type = '';
        let repeatable = '0';

        if (colIndex === 1) {
          type = 'master';
          repeatable = '0';
        } else if (colIndex >= 2 && colIndex <= 4) {
          type = 'uuc';
          repeatable = (colIndex - 2).toString();
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        if (colIndex >= 2 && colIndex <= 4) {
          if (calculated.average) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuuc',
              repeatable: '0',
              value: calculated.average || '0',
            });
          }
          if (calculated.error) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: calculated.error || '0',
            });
          }
        }
      } else if (rowIndex < weighingCount + repeatabilityCount) {
        // Repeatability
        if (colIndex >= 1 && colIndex <= 10) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'uucr',
            repeatable: (colIndex - 1).toString(),
            value: value || '0',
          });

          if (calculated.average) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuucr',
              repeatable: '0',
              value: calculated.average || '0',
            });
          }
        } else {
          return;
        }
      } else {
        // Eccentricity
        if (colIndex >= 1 && colIndex <= 10) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'uuce',
            repeatable: (colIndex - 1).toString(),
            value: value || '0',
          });

          if (calculated.eccentricity) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'eccentricity',
              repeatable: '0',
              value: calculated.eccentricity || '0',
            });
          }
        } else {
          return;
        }
      }
    } else if (selectedTableData.id === 'observationodfm') {
      // FIXED ODFM logic
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'range';
      } else if (colIndex === 2) {
        type = 'uuc';
      } else if (colIndex >= 3 && colIndex <= 7) {
        type = 'master';
        repeatable = (colIndex - 3).toString();
      } else {
        return;
      }

      // Save the current input
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 3 && colIndex <= 7) {
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
      }
    }
    else if (selectedTableData.id === 'observationdw') {
      const cycleIndex = parseInt(rowData[1]) - 1;

      if (colIndex === 3) {
        // Density change
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'density',
          repeatable: '0',
          value: value || '0',
        });
      } else if (colIndex >= 4 && colIndex <= 7) {
        let type = '';
        if (colIndex === 4) type = 'uuca'; // S1
        else if (colIndex === 5) type = 'mastera'; // U1
        else if (colIndex === 6) type = 'masterb'; // U2
        else if (colIndex === 7) type = 'uucb'; // S2

        // Save current field
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: cycleIndex.toString(),
          value: value || '0',
        });

        // Save calculated row difference (Diff -> deltai)
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'deltai',
          repeatable: cycleIndex.toString(),
          value: calculated.diff !== undefined && calculated.diff !== '' ? calculated.diff.toString() : '0',
        });

        // Recalculate average difference across all cycles for this calibration point
        let sumDiff = 0;
        let countDiff = 0;

        selectedTableData.staticRows.forEach((r, rIdx) => {
          if (selectedTableData.hiddenInputs?.calibrationPoints?.[rIdx] === calibrationPointId) {
            let rDiff = 0;
            if (rIdx === rowIndex) {
              rDiff = parseFloat(calculated.diff);
            } else {
              const diffVal = tableInputValues[`${rIdx}-8`] ?? r[8];
              rDiff = parseFloat(diffVal);
            }
            if (!isNaN(rDiff)) {
              sumDiff += rDiff;
              countDiff++;
            }
          }
        });

        const avgDiff = countDiff > 0 ? (sumDiff / countDiff).toFixed(5) : '0';

        // Save average difference — PHP stores this as type='average', repeatable=0
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'average',
          repeatable: '0',
          value: avgDiff,
        });

        // Update UI immediately for calculated values
        setTableInputValues(prev => {
          const updated = {
            ...prev,
            [`${rowIndex}-8`]: calculated.diff !== undefined && calculated.diff !== '' ? calculated.diff : '',
          };

          selectedTableData.staticRows.forEach((r, rIdx) => {
            if (selectedTableData.hiddenInputs?.calibrationPoints?.[rIdx] === calibrationPointId) {
              updated[`${rIdx}-9`] = avgDiff !== '0' ? avgDiff : '';
            }
          });

          return updated;
        });
      } else {
        return;
      }
    }

    console.log('📡 Observation Blur Payloads:', payloads);

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

      console.log(`Observation [${rowIndex}, ${colIndex}] and calculated values saved successfully!`);
      toast.success(`Observation and calculated values saved successfully!`);

      await refetchObservations();
    } catch (err) {
      console.error(`Error saving observation [${rowIndex}, ${colIndex}]:`, err);
      toast.error(err.response?.data?.message || 'Failed to save observation');
    }
  };


  const handleThermalCoeffBlur = async (type, value) => {
    if (selectedTableData.id !== 'observationctg' &&
      selectedTableData.id !== 'observationit' &&
      selectedTableData.id !== 'observationmt' &&
      selectedTableData.id !== 'observationfg' &&
      selectedTableData.id !== 'observationhg' &&
      selectedTableData.id !== 'observationexm' &&
      selectedTableData.id !== 'observationdg' &&  // ✅ ADD THIS LINE
      selectedTableData.id !== 'observationts' &&
      selectedTableData.id !== 'observationmsr') return;

    const token = localStorage.getItem('authToken');

    // Use instId instead of calibrationPointId for thermal coefficients
    const calibrationPointId = instId;

    if (!calibrationPointId) {
      toast.error('Instrument ID not found for thermal coefficient');
      return;
    }

    const payload = {
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: calibrationPointId, // This will be instId
      type: type,
      repeatable: '0',
      value: value || '0',
    };

    console.log('📡 Thermal Coefficient Payload:', payload);

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

      console.log(`✅ Thermal coefficient (${type}) saved successfully!`);
      toast.success(`Thermal coefficient saved successfully!`);
    } catch (err) {
      console.error(`❌ Error saving thermal coefficient (${type}):`, err);
      toast.error(err.response?.data?.message || 'Failed to save thermal coefficient');
    }
  };

  const refetchObservations = async () => {
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

        // ✅ ADD OBSERVATIONAVG CASE HERE
        if (observationTemplate === 'observationavg') {
          console.log('🔄 Refetching AVG observations:', observationData);

          const avgData = observationData.data || observationData;

          if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
            console.log('✅ Refetched AVG calibration_point:', avgData.calibration_point.length, 'points');
            setObservations(avgData.calibration_point);
          } else {
            console.log('❌ No AVG calibration_point found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmg') {
          console.log('🔄 Refetching MG observations:', observationData);

          const mgData = observationData.data || observationData;

          if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
            console.log('✅ Refetched MG calibration_points:', mgData.calibration_points.length, 'points');
            setObservations(mgData.calibration_points);
          } else if (mgData.observations && Array.isArray(mgData.observations)) {
            console.log('✅ Refetched MG observations:', mgData.observations.length, 'points');
            setObservations(mgData.observations);
          } else {
            console.log('❌ No MG calibration_points found after refetch');
            setObservations([]);
          }
        } else if (observationTemplate === 'observationmsr') {
          console.log('🔄 Refetching MSR observations:', observationData);

          if (Array.isArray(observationData) && observationData.length > 0) {
            const msrData = observationData[0];

            if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
              console.log('✅ Refetched MSR calibration_points:', msrData.calibration_points.length, 'points');
              setObservations(msrData.calibration_points);

              if (msrData.thermal_coeff) {
                setThermalCoeff({
                  uuc: msrData.thermal_coeff.uuc || '',
                  master: msrData.thermal_coeff.master || '',
                  thickness_of_graduation: ''
                });
              }
            } else {
              console.log('❌ No MSR calibration_points found after refetch');
              setObservations([]);
            }
          }
        }
        else if (observationTemplate === 'observationdg') {
          console.log('🔄 Refetching DG observations:', observationData);

          // DG returns observations array directly at root level
          if (observationData.observations && Array.isArray(observationData.observations)) {
            console.log('✅ DG observations found:', observationData.observations);
            setObservations(observationData.observations);
          } else if (Array.isArray(observationData)) {
            // Fallback if data is directly an array
            console.log('✅ DG observations as array:', observationData);
            setObservations(observationData);
          } else {
            console.log('❌ No DG observations found');
            setObservations([]);
          }

          // Handle thermal coefficients for DG
          if (observationData.thermal_coefficients) {
            setThermalCoeff({
              uuc: observationData.thermal_coefficients.uuc || '',
              master: observationData.thermal_coefficients.master || '',
              thickness_of_graduation: '' // DG doesn't use this field
            });
            console.log('✅ DG Thermal coefficients set:', observationData.thermal_coefficients);
          }
        }
        else if (observationTemplate === 'observationctg' && observationData.points) {
          setObservations(observationData.points);

          // ✅ NEW: Refresh least count data
          const leastCountMap = {};
          observationData.points.forEach(point => {
            if (point.id && point.least_count) {
              leastCountMap[point.id] = parseFloat(point.least_count);
            }
          });
          setLeastCountData(leastCountMap);

          if (observationData.thermal_coeff) {
            setThermalCoeff({
              uuc: observationData.thermal_coeff.uuc || '',
              master: observationData.thermal_coeff.master || '',
            });
          }
        }

        else if (observationTemplate === 'observationppg' && observationData.observations) {
          console.log('🔄 Refetching PPG observations:', observationData.observations);
          setObservations(observationData.observations);
        }

        else if (observationTemplate === 'observationgtm') {
          console.log('🔄 Refetching GTM observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched GTM calibration_points:', observationData.calibration_points.length, 'points');
            setObservations(observationData.calibration_points);
          } else if (observationData.data && Array.isArray(observationData.data)) {
            console.log('✅ Refetched GTM data:', observationData.data.length, 'points');
            setObservations(observationData.data);
          } else {
            console.log('⚠️ GTM: No new data found, keeping existing observations');
            // Don't clear observations to prevent table disappearance
          }
        }
        else if (observationTemplate === 'observationrtdwi') {
          console.log('🔄 Refetching RTD WI observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched RTD WI calibration_points:', observationData.calibration_points.length, 'points');
            setObservations(observationData.calibration_points);
          } else if (observationData.calibration_data && Array.isArray(observationData.calibration_data)) {
            console.log('✅ Refetched RTD WI calibration_data:', observationData.calibration_data.length, 'points');
            setObservations(observationData.calibration_data);
          } else if (observationData.data && observationData.data.calibration_points) {
            console.log('✅ Refetched RTD WI nested calibration_points:', observationData.data.calibration_points.length, 'points');
            setObservations(observationData.data.calibration_points);
          } else {
            console.log('⚠️ RTD WI: Keeping existing observations to prevent table disappearing');
            // DON'T clear observations - keep existing data to prevent table disappearing
          }
        }
        else if (observationTemplate === 'observationfg') {
          console.log('🔄 Refetching FG observations:', observationData);

          const fgData = observationData.data || observationData;

          // Check both possible structures
          if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
            console.log('✅ Refetched FG calibration_points:', fgData.calibration_points.length, 'points');
            setObservations(fgData.calibration_points);

            if (fgData.thermal_coefficients) {
              setThermalCoeff({
                uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
                master: fgData.thermal_coefficients.thermal_coeff_master || '',
                thickness_of_graduation: ''
              });
            }
          } else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
            console.log('✅ Refetched FG unit_types:', fgData.unit_types.length, 'types');
            setObservations(fgData.unit_types);

            if (fgData.thermal_coeff) {
              setThermalCoeff({
                uuc: fgData.thermal_coeff.uuc || '',
                master: fgData.thermal_coeff.master || '',
                thickness_of_graduation: ''
              });
            }
          } else {
            console.log('❌ No FG calibration_points or unit_types found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmm') {
          if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
            setObservations(observationData.unit_types);

            // ✅ NEW: Refresh least count data
            const leastCountMap = {};
            observationData.unit_types.forEach(unitTypeGroup => {
              if (unitTypeGroup.calibration_points) {
                unitTypeGroup.calibration_points.forEach(point => {
                  if (point.point_id && point.precision) {
                    const mode = point.mode?.toLowerCase();
                    if (mode === 'source' && point.precision.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    } else if (mode === 'measure' && point.precision.master_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.master_least_count);
                    }
                  }
                });
              }
            });
            setLeastCountData(leastCountMap);
          } else if (observationData.data && Array.isArray(observationData.data)) {
            setObservations(observationData.data);
          } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            setObservations(observationData.calibration_points);
          } else if (Array.isArray(observationData)) {
            setObservations(observationData);
          } else {
            const possiblePoints = Object.values(observationData).filter(
              item => item && typeof item === 'object' &&
                (item.unit_type !== undefined || item.calibration_points !== undefined)
            );
            if (possiblePoints.length > 0) {
              setObservations(possiblePoints);
            }
          }
        }
        else if (observationTemplate === 'observationit') {
          const itData = observationData.data || observationData;

          if (itData.calibration_points) {
            console.log('✅ Refetching IT observations:', itData.calibration_points);
            setObservations(itData.calibration_points);

            if (itData.thermal_coefficients) {
              setThermalCoeff(prev => ({
                uuc: itData.thermal_coefficients.uuc_coefficient || '',
                master: itData.thermal_coefficients.master_coefficient || '',
                thickness_of_graduation: prev.thickness_of_graduation || '',
              }));
            }
          } else {
            setObservations([]);
          }
        } else if (observationTemplate === 'observationexm') {
          console.log('🔄 Refetching EXM observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched EXM calibration_points:', observationData.calibration_points.length, 'points');
            setObservations(observationData.calibration_points);

            // Handle thermal coefficients
            if (observationData.thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData.thermal_coefficients.uuc || '',
                master: observationData.thermal_coefficients.master || '',
                thickness_of_graduation: ''
              });
            }
          } else {
            console.log('❌ No EXM calibration_points found after refetch');
            setObservations([]);
          }
        } else if (observationTemplate === 'observationhg') {
          console.log('🔄 Refetching HG observations:', observationData);

          // HG has calibration_points in the second object of the array
          const hgData = observationData[1] || observationData;

          if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
            console.log('✅ Refetched HG calibration_points:', hgData.calibration_points.length, 'points');
            setObservations(hgData.calibration_points);

            // Handle thermal coefficients from the first object
            if (observationData[0] && observationData[0].thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
                master: observationData[0].thermal_coefficients.master_coefficient || '',
                thickness_of_graduation: ''
              });
            }
          } else {
            console.log('❌ No HG calibration_points found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmt') {
          const mtData = observationData.data || observationData;

          if (mtData.calibration_points) {
            console.log('✅ Refetching MT observations:', mtData.calibration_points);
            setObservations(mtData.calibration_points);

            if (mtData.thermal_coeff) {
              setThermalCoeff({
                uuc: mtData.thermal_coeff.uuc || '',
                master: mtData.thermal_coeff.master || '',
                thickness_of_graduation: mtData.thermal_coeff.thickness_of_graduation || ''
              });
            }
          } else {
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
          setObservations(observationData.calibration_points);
        }
        else if (observationTemplate === 'observationdpg' && observationData.observations) {
          setObservations(observationData.observations);
        }
        else if (observationTemplate === 'observationapg') {
          setObservations(observationData);
        }
        else if (observationTemplate === 'observationdw') {
          console.log('🔄 Refetching DW observations:', observationData);

          const rawData =
            observationData.calibration_points && Array.isArray(observationData.calibration_points)
              ? observationData.calibration_points
              : observationData.data && Array.isArray(observationData.data)
                ? observationData.data
                : Array.isArray(observationData)
                  ? observationData
                  : null;

          const transformed = transformDwObservations(rawData);
          if (transformed) {
            console.log('✅ DW refetch transformed:', transformed.length, 'points');
            setObservations(transformed);
          } else {
            console.log('❌ No DW data found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationtm') {
          console.log('🔄 Refetching TM observations:', observationData);
          if (Array.isArray(observationData)) {
            setObservations(observationData);
          } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            setObservations(observationData.calibration_points);
          } else if (observationData.data && Array.isArray(observationData.data)) {
            setObservations(observationData.data);
          } else {
            setObservations([]);
          }
        }
        else {
          setObservations([]);
        }
      }
    } catch (error) {
      console.log('Error refetching observations:', error);
    }
  };

  const handleRowSave = async (rowIndex) => {
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

    const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

    const payloads = [];
    if (selectedTableData.id === 'observationuc') {
      const allPoints = [
        ...observations.filter(p => p && (p.mode || '').toLowerCase() === 'measure'),
        ...observations.filter(p => p && (p.mode || '').toLowerCase() === 'source')
      ];
      const point = allPoints[rowIndex];
      const isMeasure = (point?.mode || '').toLowerCase() === 'measure';

      // Range (col 2: type range)
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'range',
        repeatable: '0',
        value: rowData[2] || '0',
      });

      // Calculated Value (col 3: type calculatedmaster or calculateduuc)
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: isMeasure ? 'calculatedmaster' : 'calculateduuc',
        repeatable: '0',
        value: rowData[3] || '0',
      });

      // Set Value / Reference Value (col 4: type master or uuc)
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: isMeasure ? 'master' : 'uuc',
        repeatable: '0',
        value: rowData[4] || '0',
      });

      // Observations (col 5-9: type uuc or master, repeatable 0-4)
      const obsType = isMeasure ? 'uuc' : 'master';
      for (let i = 0; i < 5; i++) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: obsType,
          repeatable: i.toString(),
          value: rowData[5 + i] || '0',
        });
      }

      // Average (col 10)
      const avgType = isMeasure ? 'averageuuc' : 'averagemaster';
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: avgType,
        repeatable: '0',
        value: rowData[10] || '0',
      });

      // Error (col 11)
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'error',
        repeatable: '0',
        value: rowData[11] || '0',
      });
    }
    else if (selectedTableData.id === 'observationdpg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      [3, 4, 5].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
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
        type: 'repeatability',
        repeatable: '0',
        value: calculated.repeatability || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationtm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'range',
        repeatable: '0',
        value: rowData[3] || '0',
      });
      for (let obsIndex = 0; obsIndex < 10; obsIndex++) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[4 + obsIndex] || '0',
        });
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIndex.toString(),
          value: rowData[14 + obsIndex] || '0',
        });
      }
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: '0',
        value: calculated.averageUUC || '0',
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
        type: 'averagemaster',
        repeatable: '0',
        value: calculated.averageMaster || '0',
      });
    } else if (selectedTableData.id === 'observationts') {
      const rc = hiddenInputs.repeatables[rowIndex];
      for (let i = 0; i < 8; i++) {
        const colIdx = i + 1;
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: `${rc}-${i}`,
          value: rowData[colIdx] || '0',
        });
      }
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: rc.toString(),
        value: calculated.average || '0',
      });
    } else if (selectedTableData.id === 'observationdg') {
      // Nominal Value (Master Unit)
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master',
        repeatable: '0',
        value: rowData[1] || '0',
      });

      // Set 1 Forward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterinc',
        repeatable: '0',
        value: rowData[2] || '0',
      });

      // Set 1 Backward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterdec',
        repeatable: '0',
        value: rowData[3] || '0',
      });

      // Set 2 Forward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterinc',
        repeatable: '1',
        value: rowData[4] || '0',
      });

      // Set 2 Backward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterdec',
        repeatable: '1',
        value: rowData[5] || '0',
      });

      // Average Forward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemasterinc',
        repeatable: '0',
        value: calculated.averageForward || '0',
      });

      // Average Backward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemasterdec',
        repeatable: '0',
        value: calculated.averageBackward || '0',
      });

      // Error Forward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'errorinc',
        repeatable: '0',
        value: calculated.errorForward || '0',
      });

      // Error Backward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'errordec',
        repeatable: '0',
        value: calculated.errorBackward || '0',
      });

      // Hysterisis
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationavg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[2] || '0',
      });

      [3, 4].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

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
    } else if (selectedTableData.id === 'observationexm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });

      [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
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
    } else if (selectedTableData.id === 'observationhg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc', // CHANGED: Using 'uuc' type as requested
        repeatable: '0',
        value: rowData[1] || '0',
      });

      [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
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
    } else if (selectedTableData.id === 'observationodfm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'range',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      [3, 4, 5, 6, 7].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
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
    } else if (selectedTableData.id === 'observationmg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[2] || '0',
      });

      [3, 4].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

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
    }
    else if (selectedTableData.id === 'observationmm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'mode',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'range',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[3] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master',
        repeatable: '0',
        value: rowData[4] || '0',
      });
      [5, 6, 7, 8, 9].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
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
    } else if (selectedTableData.id === 'observationmt') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master', // Changed to 'master' for nominal/set value to avoid conflict
        repeatable: '0',
        value: rowData[1] || '0',
      });

      [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

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
    } else if (selectedTableData.id === 'observationwbn') {
      // Weighing process
      [2, 3, 4].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId,
          type: 'uuc', repeatable: obsIdx.toString(), value: rowData[colIdx] || '0',
        });
      });
      payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averageuuc', repeatable: '0', value: calculated.average || '0' });
      payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'error', repeatable: '0', value: calculated.error || '0' });

      // Repeatability
      [7, 8, 9, 10, 11].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId,
          type: 'uucr', repeatable: obsIdx.toString(), value: rowData[colIdx] || '0',
        });
      });
      payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averageuucr', repeatable: '0', value: calculated.averageuucr || '0' });

      // Eccentricity
      [13, 14, 15, 16, 17, 18, 19, 20, 21, 22].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId,
          type: 'uuce', repeatable: obsIdx.toString(), value: rowData[colIdx] || '0',
        });
      });
      payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'eccentricity', repeatable: '0', value: calculated.eccentricity || '0' });
    } else if (selectedTableData.id === 'observationctg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master', // Changed to 'master' for consistency
        repeatable: '0',
        value: rowData[1] || '0',
      });
      [2, 3, 4, 5, 6].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
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
    }

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

      console.log(`Row [${rowIndex}] saved successfully!`);
      toast.success(`Observation and calculated values saved successfully!`);

      await refetchObservations();
    } catch (err) {
      console.error(`Network error for row [${rowIndex}]:`, err);
      toast.error(err.response?.data?.message || 'Failed to save row data');
    }
  };

  const handleBackToInwardList = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handleBackToPerformCalibration = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVisualTestChange = (index, value) => {
    setVisualTestInputs((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleSafetyTestChange = (index, value, minrange, maxrange) => {
    let remark = '';
    const numValue = parseFloat(value);

    if (value.trim() !== '') {
      if (minrange === '<' || minrange === '>') {
        // Handle `<` or `>` logic
        const threshold = parseFloat(maxrange);
        if (minrange === '<' && numValue < threshold) {
          remark = 'Pass';
        } else if (minrange === '>' && numValue > threshold) {
          remark = 'Pass';
        } else {
          remark = 'Fail';
        }
      } else {
        // Handle min to max range
        const min = parseFloat(minrange);
        const max = parseFloat(maxrange);
        if (numValue >= min && numValue <= max) {
          remark = 'Pass';
        } else {
          remark = 'Fail';
        }
      }
    }

    setSafetyTestInputs((prev) => ({
      ...prev,
      [index]: {
        value,
        remark,
      },
    }));
  };

  const renderThermalCoefficientSection = () => {
    if (!selectedTableData?.structure?.thermalCoeff) return null;

    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Thermal Coefficient</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
          <div className={`grid ${selectedTableData.id === 'observationmt' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                UUC Thermal Coefficient:
              </label>
              <input
                type="text"
                value={thermalCoeff.uuc}
                onChange={(e) => setThermalCoeff((prev) => ({ ...prev, uuc: e.target.value }))}
                onBlur={(e) => handleThermalCoeffBlur('thermalcoffuuc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                placeholder="Enter UUC thermal coefficient"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Master Thermal Coefficient:
              </label>
              <input
                type="text"
                value={thermalCoeff.master}
                onChange={(e) => setThermalCoeff((prev) => ({ ...prev, master: e.target.value }))}
                onBlur={(e) => handleThermalCoeffBlur('thermalcoffmaster', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                placeholder="Enter master thermal coefficient"
              />
            </div>
            {/* Additional field for MT */}
            {selectedTableData.id === 'observationmt' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Thickness of graduation Line:
                </label>
                <input
                  type="text"
                  value={thermalCoeff.thickness_of_graduation}
                  onChange={(e) => setThermalCoeff((prev) => ({ ...prev, thickness_of_graduation: e.target.value }))}
                  onBlur={(e) => handleThermalCoeffBlur('thicknessofgraduation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="Enter thickness"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderObservationUCTables = () => {
    if (!selectedTableData?.modes?.length) return null;

    let globalRowIndex = 0;

    return selectedTableData.modes.map((modeGroup, groupIndex) => {
      const isMeasure = modeGroup.mode.toLowerCase() === 'measure';
      const pointsCount = modeGroup.calibration_points.length;

      const currentStartingRowIndex = globalRowIndex;
      globalRowIndex += pointsCount;

      return (
        <div key={groupIndex} className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
            {modeGroup.mode}
          </h3>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Sr. No.</th>
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Unit type</th>
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Range</th>
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    {isMeasure ? 'Nominal/ Set Value on master' : 'Nominal/ Set Value on UUC'}
                  </th>
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    {isMeasure ? 'Nominal/ Set Value on master' : 'Nominal/ Set Value on UUC'}
                  </th>
                  <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-b border-gray-300 dark:border-gray-600">
                    {isMeasure ? 'Observation on UUC' : 'Observation on Master'}
                  </th>
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Average</th>
                  <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Error</th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                  {[1, 2, 3, 4, 5].map(num => (
                    <th key={num} className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                      Observation {num}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedTableData.staticRows.slice(currentStartingRowIndex, currentStartingRowIndex + pointsCount).map((row, relativeRowIndex) => {
                  const actualRowIndex = currentStartingRowIndex + relativeRowIndex;
                  return (
                    <tr key={actualRowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, colIndex) => {
                        const key = `${actualRowIndex}-${colIndex}`;
                        const currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                        // Unit type should be static text
                        if (colIndex === 1) {
                          return (
                            <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 align-middle">
                              {cell}
                            </td>
                          );
                        }

                        // Disabled logic for observationuc
                        // colIndex 0 = Sr No, colIndex 1 = Unit (handled above)
                        // colIndex 3 = Calculated master/uuc (read only in PHP)
                        // colIndex 4 = Master/uuc original (read only in PHP)
                        // colIndex 10 = Average (read only in PHP)
                        // colIndex 11 = Error (read only in PHP)
                        const isDisabled = [0, 3, 4, 10, 11].includes(colIndex);

                        return (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 align-middle">
                            <input
                              type="text"
                              className={`w-full min-w-[50px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''} ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                              value={currentValue}
                              onChange={(e) => {
                                if (isDisabled) return;
                                handleInputChange(actualRowIndex, colIndex, e.target.value);
                                if (observationErrors[key]) {
                                  setObservationErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[key];
                                    return newErrors;
                                  });
                                }
                              }}
                              onBlur={(e) => {
                                if (isDisabled) return;
                                handleObservationBlur(actualRowIndex, colIndex, e.target.value);
                              }}
                              disabled={isDisabled}
                            />
                            {observationErrors[key] && (
                              <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };

  const renderObservationTMTable = () => {
    if (!selectedTableData?.staticRows?.length) return null;

    return (
      <div className="overflow-x-auto w-full max-w-full">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed border-collapse">
          <colgroup>
            <col className="w-12" />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-32" />
            <col className="w-32" />
          </colgroup>
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th rowSpan="2" className="border px-4 py-2 w-12 text-center">Sr. No.</th>
              <th rowSpan="2" className="border px-4 py-2 w-40 text-center">Parameter</th>
              <th rowSpan="2" className="border px-4 py-2 w-24 text-center">Nominal / Set Value</th>
              <th rowSpan="2" className="border px-4 py-2 w-20 text-center">Range</th>
              <th rowSpan="2" className="border px-4 py-2 w-24 text-center">Value Shown on</th>
              <th colSpan="5" className="border px-4 py-2 text-center">Observation</th>
              <th rowSpan="2" className="border px-4 py-2 w-32 text-center">Average</th>
              <th rowSpan="2" className="border px-4 py-2 w-32 text-center">Error</th>
            </tr>
            <tr>
              <th className="border px-2 py-2 text-center w-20">1 & 6</th>
              <th className="border px-2 py-2 text-center w-20">2 & 7</th>
              <th className="border px-2 py-2 text-center w-20">3 & 8</th>
              <th className="border px-2 py-2 text-center w-20">4 & 9</th>
              <th className="border px-2 py-2 text-center w-20">5 & 10</th>
            </tr>
          </thead>
          <tbody>
            {selectedTableData.staticRows.map((row, rowIndex) => {
              const getValue = (idx) => tableInputValues[`${rowIndex}-${idx}`] ?? (row[idx]?.toString() || '');
              const getError = (idx) => observationErrors[`${rowIndex}-${idx}`] || '';

              const renderInput = (idx, disabled = false) => (
                <div>
                  <input
                    type="text"
                    value={getValue(idx)}
                    onChange={(e) => handleInputChange(rowIndex, idx, e.target.value)}
                    onBlur={(e) => handleObservationBlur(rowIndex, idx, e.target.value)}
                    disabled={disabled}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                      } ${getError(idx) ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {getError(idx) && (
                    <span className="text-red-500 text-xs block mt-1">{getError(idx)}</span>
                  )}
                </div>
              );

              return (
                <React.Fragment key={rowIndex}>
                  {/* UUC Row 1 (Obs 1-5) */}
                  <tr>
                    <td rowSpan="4" className="border px-4 py-2 text-center">{rowIndex + 1}</td>
                    <td rowSpan="4" className="border px-4 py-2 text-center">{getValue(1)}</td>
                    <td rowSpan="4" className="border px-4 py-2 text-center">
                      <div>
                        <input
                          type="text"
                          value={getValue(2)}
                          onChange={(e) => handleInputChange(rowIndex, 2, e.target.value)}
                          onBlur={(e) => handleObservationBlur(rowIndex, 2, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </td>
                    <td rowSpan="4" className="border px-4 py-2 text-center">
                      <div>
                        <input
                          type="text"
                          value={getValue(3)}
                          onChange={(e) => handleInputChange(rowIndex, 3, e.target.value)}
                          onBlur={(e) => handleObservationBlur(rowIndex, 3, e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getError(3) ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        />
                        {getError(3) && <span className="text-red-500 text-xs block mt-1">{getError(3)}</span>}
                      </div>
                    </td>
                    <td rowSpan="2" className="border px-4 py-2 text-center font-medium text-gray-900 dark:text-white">UUC</td>
                    <td className="border px-4 py-2">{renderInput(4)}</td>
                    <td className="border px-4 py-2">{renderInput(5)}</td>
                    <td className="border px-4 py-2">{renderInput(6)}</td>
                    <td className="border px-4 py-2">{renderInput(7)}</td>
                    <td className="border px-4 py-2">{renderInput(8)}</td>
                    <td rowSpan="2" className="border px-4 py-2">{renderInput(24, true)}</td>
                    <td rowSpan="4" className="border px-4 py-2">{renderInput(25, true)}</td>
                  </tr>
                  {/* UUC Row 2 (Obs 6-10) */}
                  <tr>
                    <td className="border px-4 py-2">{renderInput(9)}</td>
                    <td className="border px-4 py-2">{renderInput(10)}</td>
                    <td className="border px-4 py-2">{renderInput(11)}</td>
                    <td className="border px-4 py-2">{renderInput(12)}</td>
                    <td className="border px-4 py-2">{renderInput(13)}</td>
                  </tr>
                  {/* Master Row 1 (Obs 1-5) */}
                  <tr>
                    <td rowSpan="2" className="border px-4 py-2 text-center font-medium text-gray-900 dark:text-white">Master</td>
                    <td className="border px-4 py-2">{renderInput(14)}</td>
                    <td className="border px-4 py-2">{renderInput(15)}</td>
                    <td className="border px-4 py-2">{renderInput(16)}</td>
                    <td className="border px-4 py-2">{renderInput(17)}</td>
                    <td className="border px-4 py-2">{renderInput(18)}</td>
                    <td rowSpan="2" className="border px-4 py-2">{renderInput(26, true)}</td>
                  </tr>
                  {/* Master Row 2 (Obs 6-10) */}
                  <tr>
                    <td className="border px-4 py-2">{renderInput(19)}</td>
                    <td className="border px-4 py-2">{renderInput(20)}</td>
                    <td className="border px-4 py-2">{renderInput(21)}</td>
                    <td className="border px-4 py-2">{renderInput(22)}</td>
                    <td className="border px-4 py-2">{renderInput(23)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const handleBiomedicalInputChange = (pointId, type, index, value) => {
    const key = `${pointId}-${type}${type === 'master' || type === 'uuc' ? `-${index}` : ''}`;
    setTableInputValues(prev => {
      const newValues = { ...prev, [key]: value };

      let uucSum = 0;
      let uucCountNum = 0;
      let masterSum = 0;
      let masterCountNum = 0;

      for (let i = 0; i < 5; i++) {
        const uVal = parseFloat(newValues[`${pointId}-uuc-${i}`]);
        if (!isNaN(uVal)) {
          uucSum += uVal;
          uucCountNum++;
        }

        const mVal = parseFloat(newValues[`${pointId}-master-${i}`]);
        if (!isNaN(mVal)) {
          masterSum += mVal;
          masterCountNum++;
        }
      }

      const avgUuc = uucCountNum > 0 ? (uucSum / uucCountNum).toFixed(3) : '';
      const avgMaster = masterCountNum > 0 ? (masterSum / masterCountNum).toFixed(3) : '';

      newValues[`${pointId}-averageuuc`] = avgUuc;
      newValues[`${pointId}-averagemaster`] = avgMaster;

      const finalUuc = avgUuc !== '' ? parseFloat(avgUuc) : parseFloat(newValues[`${pointId}-uuc-0`]) || 0;
      const finalMaster = avgMaster !== '' ? parseFloat(avgMaster) : parseFloat(newValues[`${pointId}-master-0`]) || 0;

      if (finalUuc !== 0 || finalMaster !== 0) {
        newValues[`${pointId}-error`] = (finalUuc - finalMaster).toFixed(3);
      }

      return newValues;
    });
  };

  const handleBiomedicalInputBlur = async (pointId, type, index) => {
    const key = `${pointId}-${type}${type === 'master' || type === 'uuc' ? `-${index}` : ''}`;
    const value = tableInputValues[key] || '';

    const payload = {
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: pointId,
      type: type,
      repeatable: (type === 'master' || type === 'uuc') ? index.toString() : '0',
      value: value,
    };

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${JWT_HOST_API}/calibrationprocess/set-observations`,
        payload,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      if (type === 'uuc' || type === 'master') {
        const avgKey = type === 'uuc' ? 'averageuuc' : 'averagemaster';
        await axios.post(`${JWT_HOST_API}/calibrationprocess/set-observations`, {
          inwardid: inwardId, instid: instId, calibrationpoint: pointId, type: avgKey, repeatable: '0', value: tableInputValues[`${pointId}-${avgKey}`] || ''
        }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });

        await axios.post(`${JWT_HOST_API}/calibrationprocess/set-observations`, {
          inwardid: inwardId, instid: instId, calibrationpoint: pointId, type: 'error', repeatable: '0', value: tableInputValues[`${pointId}-error`] || ''
        }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      console.error('Error saving biomedical observation:', err);
      toast.error('Failed to save observation');
    }
  };

  const renderObservationBiomedicalTables = () => {
    if (!selectedTableData || !selectedTableData.calibration_points) return null;
    const points = selectedTableData.calibration_points;
    const measureSafety = points.filter(p => p.mode === 'Measure' && p.is_electrical_safety);
    const sourceSafety = points.filter(p => p.mode === 'Source' && p.is_electrical_safety);
    const measurePerf = points.filter(p => p.mode === 'Measure' && !p.is_electrical_safety);

    const renderTable = (title, tablePoints, masterCount, uucCount, showDevAndUnc) => {
      if (!tablePoints || tablePoints.length === 0) return null;
      return (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2 uppercase">{title}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Parameter</th>
                  {showDevAndUnc && <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Set Point</th>}
                  {masterCount > 0 && <th colSpan={masterCount} className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Reading on Master</th>}
                  {masterCount > 1 && <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Average On Master</th>}
                  {uucCount > 0 && <th colSpan={uucCount} className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Reading on UUC</th>}
                  {uucCount > 1 && <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Average On UUC</th>}
                  {showDevAndUnc && <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Deviation</th>}
                  <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Tolerance</th>
                  {showDevAndUnc && (
                    <>
                      <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">(±) Expanded Uncertainty</th>
                      <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-gray-800 dark:text-white text-center">Remarks</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tablePoints.map((point) => {
                  const pointId = point.id;
                  return (
                    <tr key={`bio-${pointId}`} className="dark:bg-gray-800">
                      <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                        <input type="text" className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-parameter`] ?? (point.parameter || point.unittype || '')} readOnly />
                      </td>
                      {showDevAndUnc && (
                        <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                          <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={point.point || ''} readOnly /> {point.unit || ''}
                        </td>
                      )}
                      {Array.from({ length: masterCount }).map((_, i) => (
                        <td key={`master-${i}`} className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                          <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-master-${i}`] ?? ''} onChange={(e) => handleBiomedicalInputChange(pointId, 'master', i, e.target.value)} onBlur={() => handleBiomedicalInputBlur(pointId, 'master', i)} />
                        </td>
                      ))}
                      {masterCount > 1 && (
                        <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                          <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-averagemaster`] ?? ''} readOnly />
                        </td>
                      )}
                      {Array.from({ length: uucCount }).map((_, i) => (
                        <td key={`uuc-${i}`} className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                          <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-uuc-${i}`] ?? ''} onChange={(e) => handleBiomedicalInputChange(pointId, 'uuc', i, e.target.value)} onBlur={() => handleBiomedicalInputBlur(pointId, 'uuc', i)} />
                        </td>
                      ))}
                      {uucCount > 1 && (
                        <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                          <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-averageuuc`] ?? ''} readOnly />
                        </td>
                      )}
                      {showDevAndUnc && (
                        <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                          <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-error`] ?? ''} readOnly />
                        </td>
                      )}
                      <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                        <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-specification`] ?? (point.tolerance || '')} onChange={(e) => handleBiomedicalInputChange(pointId, 'specification', 0, e.target.value)} onBlur={() => handleBiomedicalInputBlur(pointId, 'specification', 0)} />
                      </td>
                      {showDevAndUnc && (
                        <>
                          <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                            <input type="text" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-expandeduncertainty`] ?? ''} onChange={(e) => handleBiomedicalInputChange(pointId, 'expandeduncertainty', 0, e.target.value)} onBlur={() => handleBiomedicalInputBlur(pointId, 'expandeduncertainty', 0)} /> %
                          </td>
                          <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                            <input type="text" className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white" value={tableInputValues[`${pointId}-remark`] ?? ''} onChange={(e) => handleBiomedicalInputChange(pointId, 'remark', 0, e.target.value)} onBlur={() => handleBiomedicalInputBlur(pointId, 'remark', 0)} />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const showElectricalSafety = instrument?.showelectricalsafety === 'Yes';
    return (
      <div className="space-y-6">
        {renderTable(showElectricalSafety ? "3. ELECTRICAL SAFETY TEST" : "3. PERFORMANCE TESTING", measureSafety, 1, 5, !showElectricalSafety)}
        {renderTable("PERFORMANCE TESTING (Source)", sourceSafety, 5, 1, !showElectricalSafety)}
        {renderTable("4. PERFORMANCE TESTING", measurePerf, 1, 5, true)}
      </div>
    );
  };

  const renderWeighingBalanceTables = () => {
    const weighingCount = selectedTableData.weighingCount || 0;
    const repeatabilityCount = selectedTableData.repeatabilityCount || 0;
    const eccentricityCount = selectedTableData.eccentricityCount || 0;

    return (
      <div className="space-y-8">
        {/* Diagram Selection */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 dark:text-white mb-3">Diagram Choice</h3>
          <div className="flex gap-8 justify-center mb-6">
            <div className="flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700 p-4 rounded bg-white dark:bg-gray-800">
              <img src={`${IMAGE_HOST_API}/images/circalimg.png`} alt="Circular Diagram" className="h-32 object-contain" />
              <label className="flex items-center gap-2 text-sm font-medium dark:text-white mt-2">
                <input
                  type="radio"
                  name="daigram"
                  value="circalimg"
                  checked={diagram === 'circalimg'}
                  onChange={(e) => setDiagram(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                Circular Diagram
              </label>
            </div>
            <div className="flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700 p-4 rounded bg-white dark:bg-gray-800">
              <img src={`${IMAGE_HOST_API}/images/newrectangle.png`} alt="Rectangular Diagram" className="h-32 object-contain" />
              <label className="flex items-center gap-2 text-sm font-medium dark:text-white mt-2">
                <input
                  type="radio"
                  name="daigram"
                  value="newrectangle"
                  checked={diagram === 'newrectangle'}
                  onChange={(e) => setDiagram(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                Rectangular Diagram
              </label>
            </div>
          </div>
        </div>

        {/* 1. Weighing Process Table */}
        {weighingCount > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
              Weighing Process
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Sr. No.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Nominal Value</th>
                    <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Reading</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Average</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Error</th>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                    <th className="border-r border-gray-300 dark:border-gray-600"></th>
                    <th className="border-r border-gray-300 dark:border-gray-600"></th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">1</th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">2</th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">3</th>
                    <th className="border-r border-gray-300 dark:border-gray-600"></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedTableData.staticRows.slice(0, weighingCount).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        const currentValue = tableInputValues[key] ?? (cell?.toString() || '');
                        const isDisabled = colIndex === 0 || colIndex === 1 || colIndex === 5 || colIndex === 6;

                        return (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                            <input
                              type="text"
                              className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600'
                                } ${observationErrors[key] ? 'border-red-500 focus:ring-red-500' : ''}`}
                              value={currentValue}
                              onChange={(e) => {
                                if (isDisabled) return;
                                handleInputChange(rowIndex, colIndex, e.target.value);
                              }}
                              onBlur={(e) => {
                                if (isDisabled) return;
                                handleObservationBlur(rowIndex, colIndex, e.target.value);
                              }}
                              disabled={isDisabled}
                            />
                            {observationErrors[key] && (
                              <span className="text-red-500 text-xs block mt-1">{observationErrors[key]}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Repeatability Table */}
        {repeatabilityCount > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
              Repeatability
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Nominal Value</th>
                    <th colSpan="10" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Reading on UUC</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Average</th>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                    <th className="border-r border-gray-300 dark:border-gray-600"></th>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <th key={i} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">{i + 1}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedTableData.staticRows.slice(weighingCount, weighingCount + repeatabilityCount).map((row, index) => {
                    const rowIndex = weighingCount + index;
                    return (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {row.map((cell, colIndex) => {
                          const key = `${rowIndex}-${colIndex}`;
                          const currentValue = tableInputValues[key] ?? (cell?.toString() || '');
                          const isDisabled = colIndex === 0 || colIndex === 11;

                          return (
                            <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600'
                                  } ${observationErrors[key] ? 'border-red-500 focus:ring-red-500' : ''}`}
                                value={currentValue}
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  handleInputChange(rowIndex, colIndex, e.target.value);
                                }}
                                onBlur={(e) => {
                                  if (isDisabled) return;
                                  handleObservationBlur(rowIndex, colIndex, e.target.value);
                                }}
                                disabled={isDisabled}
                              />
                              {observationErrors[key] && (
                                <span className="text-red-500 text-xs block mt-1">{observationErrors[key]}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Eccentricity Table */}
        {eccentricityCount > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
              Eccentricity
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Nominal Value</th>
                    <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Reading on Clockwise</th>
                    <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">Reading on Anticlockwise</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">D=Ec (Max-Min)/2</th>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                    <th className="border-r border-gray-300 dark:border-gray-600"></th>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">{i + 1}</th>
                    ))}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i + 5} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">{i + 1}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedTableData.staticRows.slice(weighingCount + repeatabilityCount).map((row, index) => {
                    const rowIndex = weighingCount + repeatabilityCount + index;
                    return (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {row.map((cell, colIndex) => {
                          const key = `${rowIndex}-${colIndex}`;
                          const currentValue = tableInputValues[key] ?? (cell?.toString() || '');
                          const isDisabled = colIndex === 0 || colIndex === 11;

                          return (
                            <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600'
                                  } ${observationErrors[key] ? 'border-red-500 focus:ring-red-500' : ''}`}
                                value={currentValue}
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  handleInputChange(rowIndex, colIndex, e.target.value);
                                }}
                                onBlur={(e) => {
                                  if (isDisabled) return;
                                  handleObservationBlur(rowIndex, colIndex, e.target.value);
                                }}
                                disabled={isDisabled}
                              />
                              {observationErrors[key] && (
                                <span className="text-red-500 text-xs block mt-1">{observationErrors[key]}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!validateForm()) {
      toast.error('Please correct the validation errors before submitting.');
      return;
    }

    // Validate observation fields
    if (!validateObservationFields()) {
      toast.error('Please fill all required observation fields before submitting.');
      // Scroll to first error
      const firstErrorKey = Object.keys(observationErrors)[0];
      if (firstErrorKey) {
        const [rowIndex, colIndex] = firstErrorKey.split('-');
        console.error('❌ First validation error at:', { rowIndex, colIndex, error: observationErrors[firstErrorKey] });
      }
      return;
    }

    const token = localStorage.getItem('authToken');


    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    const firstRowCalibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[0] || instId;
    const thermalCalibrationPointId = selectedTableData.id === 'observationmt' ? instId : firstRowCalibPointId;

    // Add thermal coefficients for applicable observation types
    if (selectedTableData.id === 'observationctg' ||
      selectedTableData.id === 'observationit' ||
      selectedTableData.id === 'observationmt' ||
      selectedTableData.id === 'observationexm' ||
      selectedTableData.id === 'observationfg' ||
      selectedTableData.id === 'observationhg' ||
      selectedTableData.id === 'observationdg' ||  // ✅ ADD THIS LINE
      selectedTableData.id === 'observationmsr') {

      calibrationPoints.push(thermalCalibrationPointId);
      types.push('thermalcoffuuc');
      repeatables.push('0');
      values.push(thermalCoeff.uuc || '0');

      calibrationPoints.push(thermalCalibrationPointId);
      types.push('thermalcoffmaster');
      repeatables.push('0');
      values.push(thermalCoeff.master || '0');

      if (selectedTableData.id === 'observationmt' && thermalCoeff.thickness_of_graduation) {
        calibrationPoints.push(thermalCalibrationPointId);
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

      const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

      // 1. observationdpg
      if (selectedTableData.id === 'observationdpg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4, 5].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('repeatability');
        repeatables.push('0');
        values.push(calculated.repeatability || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }

      // 2. observationmsr
      else if (selectedTableData.id === 'observationmsr') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }
      else if (selectedTableData.id === 'observationrtdwi') {
        const isUUCRow = rowData[2] === 'UUC';
        const isMasterRow = rowData[2] === 'Master';

        if (isUUCRow) {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          calibrationPoints.push(calibPointId);
          types.push('unit');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          calibrationPoints.push(calibPointId);
          types.push('sensitivitycoefficient');
          repeatables.push('0');
          values.push(rowData[4] || '0');

          [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averageuuc');
          repeatables.push('0');
          values.push(calculated.average || '0');

          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(calculated.error || '0');
        } else if (isMasterRow) {
          calibrationPoints.push(calibPointId);
          types.push('masterunit');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(rowData[10] || calculated.average || '0');

          calibrationPoints.push(calibPointId);
          types.push('ambientmaster');
          repeatables.push('0');
          values.push(rowData[11] || '0');

          calibrationPoints.push(calibPointId);
          types.push('saveragemaster');
          repeatables.push('0');
          values.push(calculated.correctedAverage || '0');

          calibrationPoints.push(calibPointId);
          types.push('caveragemaster');
          repeatables.push('0');
          values.push(rowData[10] || calculated.average || '0');
        }
      }
      else if (selectedTableData.id === 'observationth') {
        const isUUCRow = rowData[1] === 'UUC';
        const isMasterRow = rowData[1] === 'Master';

        if (isUUCRow) {
          calibrationPoints.push(calibPointId);
          types.push('uucrange');
          repeatables.push('0');
          values.push(rowData[2] || '');

          calibrationPoints.push(calibPointId);
          types.push('setpoint');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averageuuc');
          repeatables.push('0');
          values.push(rowData[10] || calculated.average || '0');
        } else if (isMasterRow) {
          [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(rowData[10] || calculated.average || '0');

          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(rowData[11] || '0');
        }
      }
      else if (selectedTableData.id === 'observationppg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4, 5, 6, 7, 8].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('repeatability');
        repeatables.push('0');
        values.push(calculated.repeatability || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }
      else if (selectedTableData.id === 'observationdg') {
        // Nominal Value (Master Unit)
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        // Set 1 Forward
        calibrationPoints.push(calibPointId);
        types.push('masterinc');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        // Set 1 Backward
        calibrationPoints.push(calibPointId);
        types.push('masterdec');
        repeatables.push('0');
        values.push(rowData[3] || '0');

        // Set 2 Forward
        calibrationPoints.push(calibPointId);
        types.push('masterinc');
        repeatables.push('1');
        values.push(rowData[4] || '0');

        // Set 2 Backward
        calibrationPoints.push(calibPointId);
        types.push('masterdec');
        repeatables.push('1');
        values.push(rowData[5] || '0');

        // Average Forward Reading
        calibrationPoints.push(calibPointId);
        types.push('averagemasterinc');
        repeatables.push('0');
        values.push(calculated.averageForward || '0');

        // Average Backward Reading
        calibrationPoints.push(calibPointId);
        types.push('averagemasterdec');
        repeatables.push('0');
        values.push(calculated.averageBackward || '0');

        // Error Forward Reading
        calibrationPoints.push(calibPointId);
        types.push('errorinc');
        repeatables.push('0');
        values.push(calculated.errorForward || '0');

        // Error Backward Reading
        calibrationPoints.push(calibPointId);
        types.push('errordec');
        repeatables.push('0');
        values.push(calculated.errorBackward || '0');

        // Hysterisis
        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }
      else if (selectedTableData.id === 'observationtm') {
        const rowData = row.map((cell, idx) => {
          const inputKey = `${rowIndex}-${idx}`;
          return tableInputValues[inputKey] ?? (cell?.toString() || '');
        });

        // Range
        calibrationPoints.push(calibPointId);
        types.push('range');
        repeatables.push('0');
        values.push(rowData[3] || '0');

        // UUC Observations (uuc 0-9)
        for (let obsIndex = 0; obsIndex < 10; obsIndex++) {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[4 + obsIndex] || '0');
        }

        // Master Observations (master 0-9)
        for (let obsIndex = 0; obsIndex < 10; obsIndex++) {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[14 + obsIndex] || '0');
        }

        // Average UUC
        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(rowData[24] || '0');

        // Error
        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(rowData[25] || '0');

        // Average Master
        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(rowData[26] || '0');
      }

      else if (selectedTableData.id === 'observationgtm') {
        const isUUCRow = row[2] === 'UUC';
        const isMasterRow = row[2] === 'Master';

        if (isUUCRow) {
          // UUC row payloads
          const rowData = row.map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          });

          // Set Point (col 1: type uuc)
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          // Range (col 3: type range)
          calibrationPoints.push(calibPointId);
          types.push('range');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          // Unit (col 4: type unit)
          calibrationPoints.push(calibPointId);
          types.push('unit');
          repeatables.push('0');
          values.push(rowData[4] || '0');

          // Observations 1-5 (cols 6-10: type uuc, repeatable 0-4)
          [6, 7, 8, 9, 10].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          // Average (°C) for UUC (col 12: type averageuuc) - use latest from UI
          const uucAverageC = rowData[12] || '0';
          calibrationPoints.push(calibPointId);
          types.push('averageuuc');
          repeatables.push('0');
          values.push(uucAverageC);

          // ✅ Deviation (°C) (col 13: type error) - use LATEST from UI (already calculated)
          // This ensures we submit the final value without recalc - matches UI state
          const latestDeviation = tableInputValues[`${rowIndex}-13`] ?? rowData[13] ?? '0';
          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(latestDeviation);

          console.log('📤 GTM UUC Submit Payloads:', {
            uucAverageC,
            latestDeviation,
            rowIndex
          });

        } else if (isMasterRow) {
          // Master row payloads
          const rowData = row.map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          });

          // Master Unit (col 4: type masterunit) - send unit ID from ReactSelect value
          const unitLabel = rowData[4] || '';
          const selectedUnit = unitsList.find(u => u.label === unitLabel);
          calibrationPoints.push(calibPointId);
          types.push('masterunit');
          repeatables.push('0');
          values.push(selectedUnit ? selectedUnit.value.toString() : '0');

          // Sensitivity Coefficient (col 5: type sensitivitycoefficient)
          calibrationPoints.push(calibPointId);
          types.push('sensitivitycoefficient');
          repeatables.push('0');
          values.push(rowData[5] || '0');

          // Observations 1-5 (cols 6-10: type master, repeatable 0-4)
          [6, 7, 8, 9, 10].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          // Average (Ω) (col 11: type averagemaster) - use latest from UI
          const masterAverageOmega = rowData[11] || '0';
          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(masterAverageOmega);

          // ✅ Average (°C) for Master (col 12: type caveragemaster) - use LATEST from UI
          const masterConvertedAvg = rowData[12] || '0';
          calibrationPoints.push(calibPointId);
          types.push('caveragemaster');
          repeatables.push('0');
          values.push(masterConvertedAvg);

          console.log('📤 GTM Master Submit Payloads:', {
            masterAverageOmega,
            masterConvertedAvg,
            rowIndex
          });
        }
      }

      else if (selectedTableData.id === 'observationavg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

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
      }

      // 6. observationhg
      else if (selectedTableData.id === 'observationhg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 7. observationfg
      else if (selectedTableData.id === 'observationfg') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      else if (selectedTableData.id === 'observationmm') {
        // ✅ FIXED: Add least count validation check before submitting
        const leastCount = leastCountData[calibPointId];

        // Mode field
        calibrationPoints.push(calibPointId);
        types.push('mode');
        repeatables.push('0');
        values.push(rowData[1] || 'Measure');

        // Range
        calibrationPoints.push(calibPointId);
        types.push('range');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        // Calculated master
        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[3] || '0');

        // Master value
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[4] || '0');

        // ✅ Observations with least count validation
        [5, 6, 7, 8, 9].forEach((colIdx, obsIdx) => {
          const obsValue = rowData[colIdx] || '0';
          const numValue = parseFloat(obsValue);

          // Double-check least count validation before submitting
          if (leastCount && numValue !== 0) {
            if (numValue < leastCount || numValue % leastCount !== 0) {
              console.warn(`⚠️ MM: Observation ${obsIdx + 1} (${numValue}) doesn't meet least count ${leastCount}`);
            }
          }

          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIdx.toString());
          values.push(obsValue);
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 9. observationexm
      else if (selectedTableData.id === 'observationexm') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 10. observationmg
      else if (selectedTableData.id === 'observationmg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

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
      }

      // 11. observationodfm
      else if (selectedTableData.id === 'observationodfm') {
        calibrationPoints.push(calibPointId);
        types.push('range');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4, 5, 6, 7].forEach((colIdx, obsIdx) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIdx.toString());
          values.push(rowData[colIdx] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 12. observationapg
      else if (selectedTableData.id === 'observationapg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
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
      }

      // 13. observationit
      else if (selectedTableData.id === 'observationit') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 14. observationmt
      else if (selectedTableData.id === 'observationmt') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex], 10) || 5;
        [2, 3, 4, 5, 6].slice(0, repeatableCycle).forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 15. observationctg
      else if (selectedTableData.id === 'observationctg') {
        // ✅ FIXED: Add least count validation check before submitting
        const leastCount = leastCountData[calibPointId];

        // Nominal value
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        // ✅ Observations with least count validation
        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          const obsValue = rowData[colIndex] || '0';
          const numValue = parseFloat(obsValue);

          // Double-check least count validation before submitting
          if (leastCount && numValue !== 0) {
            if (numValue < leastCount || numValue % leastCount !== 0) {
              console.warn(`⚠️ CTG: Observation ${obsIndex + 1} (${numValue}) doesn't meet least count ${leastCount}`);
            }
          }

          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(obsValue);
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }
      else if (selectedTableData.id === 'observationdw') {
        const cycleIndex = parseInt(rowData[1]) - 1;

        calibrationPoints.push(calibPointId);
        types.push('uuca');
        repeatables.push(cycleIndex.toString());
        values.push(rowData[4] || '0');

        calibrationPoints.push(calibPointId);
        types.push('mastera');
        repeatables.push(cycleIndex.toString());
        values.push(rowData[5] || '0');

        calibrationPoints.push(calibPointId);
        types.push('masterb');
        repeatables.push(cycleIndex.toString());
        values.push(rowData[6] || '0');

        calibrationPoints.push(calibPointId);
        types.push('uucb');
        repeatables.push(cycleIndex.toString());
        values.push(rowData[7] || '0');

        calibrationPoints.push(calibPointId);
        types.push('deltai');
        repeatables.push(cycleIndex.toString());
        values.push(calculated.diff !== undefined && calculated.diff !== '' ? calculated.diff.toString() : '0');

        if (cycleIndex === 0) {
          calibrationPoints.push(calibPointId);
          types.push('density');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          let sumDiff = 0;
          let countDiff = 0;
          selectedTableData.staticRows.forEach((r, rIdx) => {
            if (selectedTableData.hiddenInputs?.calibrationPoints?.[rIdx] === calibPointId) {
              const otherRowData = selectedTableData.staticRows[rIdx].map((c, idx) => {
                const inputKey = `${rIdx}-${idx}`;
                return tableInputValues[inputKey] ?? (c?.toString() || '');
              });
              const otherCalculated = calculateRowValues(otherRowData, 'observationdw');
              const rDiff = parseFloat(otherCalculated.diff);
              if (!isNaN(rDiff)) {
                sumDiff += rDiff;
                countDiff++;
              }
            }
          });
          const avgDiff = countDiff > 0 ? (sumDiff / countDiff).toFixed(5) : '0';

          calibrationPoints.push(calibPointId);
          types.push('average');   // PHP stores Avg.Diff as type='average'
          repeatables.push('0');
          values.push(avgDiff);
        }
      }
      else if (selectedTableData.id === 'observationwb') {
        const weighingCount = selectedTableData?.weighingCount || 0;
        const repeatabilityCount = selectedTableData?.repeatabilityCount || 0;

        if (rowIndex < weighingCount) {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          [2, 3, 4].forEach((colIdx, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIdx] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averageuuc');
          repeatables.push('0');
          values.push(calculated.average || '0');

          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(calculated.error || '0');
        } else if (rowIndex < weighingCount + repeatabilityCount) {
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((colIdx, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uucr');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIdx] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averageuucr');
          repeatables.push('0');
          values.push(calculated.average || '0');
        } else {
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((colIdx, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuce');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIdx] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('eccentricity');
          repeatables.push('0');
          values.push(calculated.eccentricity || '0');
        }
      }

    });

    const payloadStep3 = {
      inwardid: inwardId,
      instid: instId,
      caliblocation: caliblocation,
      calibacc: calibacc,
      tempend: formData.tempend,
      humiend: formData.humiend,
      pressurestart: formData.pressurestart,
      pressureend: formData.pressureend,
      stabilizationtime: formData.stabilizationtime,
      notes: formData.notes,
      enddate: formData.enddate,
      duedate: formData.duedate,
      daigram: diagram,
      calibrationpoint: calibrationPoints,
      type: types,
      repeatable: repeatables,
      value: values,
    };

    console.log('Step 3 Payload:', payloadStep3);

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

      console.log('Step 3 saved successfully:', response.data);
      toast.success('All data submitted successfully!');
      setTimeout(() => {
        navigate(
          `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
      }, 1000);
    } catch (error) {
      console.error('Network Error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong while submitting');
    }
  };

  return (
    <Page title="CalibrateStep3">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-medium text-gray-800 dark:text-white">Fill Dates</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToInwardList}
                  className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ← Back to Inward Entry List
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBackToPerformCalibration}
                  className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ← Back to Perform Calibration
                </Button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-12 gap-4 text-sm">
                <div className="col-span-6 space-y-2">
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">
                      Name Of The Equipment:
                    </span>
                    <span className="text-gray-900 dark:text-white">{instrument?.name || 'N/A'}</span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    PRESSURE, MASS & VOLUME LAB<br />
                    Alloted Lab: {caliblocation}
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Make:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.make || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Model:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.model || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">SR no:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.serialno || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Id no:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.idno || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Calibrated On:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.startdate || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Issue Date:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.issuedate || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-span-6 space-y-2">
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">BRN No:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.bookingrefno || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Receive Date:</span>
                    <span className="text-gray-900 dark:text-white">
                      {inwardEntry?.sample_received_on || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Range:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.equipmentrange || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Least Count:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.leastcount || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Condition Of UUC:</span>
                    <span className="text-gray-900 dark:text-white">
                      {instrument?.conditiononrecieve || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">
                      Calibration performed At:
                    </span>
                    <span className="text-gray-900 dark:text-white">{instrument?.performedat || 'Lab'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Temperature (°C):</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.temperature || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Humidity (%RH):</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.humidity || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Masters</h2>
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Reference Standard
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          S.w/o
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          LD.No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Certificate No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Valid Upto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {masters && masters.length > 0 ? (
                        masters.map((item, index) => (
                          <tr key={index} className="dark:bg-gray-800">
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.name}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.serialno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.idno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.certificateno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.enddate}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2">Support masters</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Reference Standard
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          S.w/o
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          LD.No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Certificate No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Valid Upto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportMasters && supportMasters.length > 0 ? (
                        supportMasters.map((item, index) => (
                          <tr key={index} className="dark:bg-gray-800">
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.name}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.serialno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.idno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.certificateno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.enddate}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderThermalCoefficientSection()}

              {instrument?.biomedical === 'Yes' && instrument?.showvisualtest === 'Yes' && visualTests.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2 uppercase">1. Visual Inspection</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                            Description
                          </th>
                          <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                            Remark
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visualTests.map((test, index) => (
                          <tr key={test.id || index} className="dark:bg-gray-800">
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white w-2/3">
                              {test.description}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white w-1/3">
                              <input
                                type="text"
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                value={visualTestInputs[index] || ''}
                                onChange={(e) => handleVisualTestChange(index, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {instrument?.biomedical === 'Yes' && instrument?.showbasicsafety === 'Yes' && safetyTests.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2 uppercase">2. Basic Safety Test</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                            Description
                          </th>
                          <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                            Observed Value
                          </th>
                          <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                            Remark
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {safetyTests.map((test, index) => (
                          <tr key={test.id || index} className="dark:bg-gray-800">
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white w-1/2">
                              {test.description} ({test.specification})
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white w-1/4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                  value={safetyTestInputs[index]?.value || ''}
                                  onChange={(e) => handleSafetyTestChange(index, e.target.value, test.minrange, test.maxrange)}
                                />
                                <span>{test.unit}</span>
                              </div>
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white w-1/4">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded-md focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed ${safetyTestInputs[index]?.remark === 'Pass' ? 'text-green-600 dark:text-green-400 font-bold border-green-300' :
                                  safetyTestInputs[index]?.remark === 'Fail' ? 'text-red-600 dark:text-red-400 font-bold border-red-300' :
                                    'border-gray-300 dark:border-gray-600'
                                  }`}
                                value={safetyTestInputs[index]?.remark || ''}
                                readOnly
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-md font-medium text-gray-800 dark:text-white mb-4">Observation Detail</h2>
                {observationTemplate && (
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Current Observation Template:</strong> {observationTemplate}
                    </p>
                  </div>
                )}

                {selectedTableData && tableStructure && (
                  <div className="space-y-6">
                    {selectedTableData.id === 'observationbiomedical' ? (
                      renderObservationBiomedicalTables()
                    ) : selectedTableData.id === 'observationwb' ? (
                      renderWeighingBalanceTables()
                    ) : selectedTableData.id === 'observationtm' ? (
                      renderObservationTMTable()
                    ) : selectedTableData.id === 'observationuc' && selectedTableData.modes ? (
                      renderObservationUCTables()
                    ) : selectedTableData.id === 'observationmm' && selectedTableData.unitTypes ? (
                      // Render separate tables for each unit type in MM
                      selectedTableData.unitTypes.map((unitTypeGroup, groupIndex) => {
                        if (!unitTypeGroup || !unitTypeGroup.calibration_points) return null;

                        // Calculate starting row index for this unit type group
                        let startingRowIndex = 0;
                        for (let i = 0; i < groupIndex; i++) {
                          if (selectedTableData.unitTypes[i] && selectedTableData.unitTypes[i].calibration_points) {
                            startingRowIndex += selectedTableData.unitTypes[i].calibration_points.length;
                          }
                        }

                        const unitTypeRows = unitTypeGroup.calibration_points.map(point => {
                          const observations = [];
                          if (point.observations && Array.isArray(point.observations)) {
                            for (let i = 0; i < 5; i++) {
                              observations.push(point.observations[i]?.value || '');
                            }
                          }
                          while (observations.length < 5) {
                            observations.push('');
                          }

                          return [
                            point.sequence_number?.toString() || '',
                            point.mode || 'Measure',
                            point.range || '',
                            (point.nominal_values?.calculated_master?.value || ''),
                            (point.nominal_values?.master?.value || ''),
                            ...observations,
                            point.calculations?.average || '',
                            point.calculations?.error || ''
                          ];
                        });

                        return (
                          <div key={groupIndex} className="mb-8">
                            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
                              {unitTypeGroup.unit_type}
                            </h3>
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                                    {tableStructure.headers.map((header, index) => (
                                      <th
                                        key={index}
                                        colSpan={header.colspan}
                                        className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                      >
                                        {header.name}
                                      </th>
                                    ))}
                                  </tr>
                                  {tableStructure.subHeadersRow.some((item) => item !== null) && (
                                    <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                                      {tableStructure.subHeadersRow.map((subHeader, index) => (
                                        <th
                                          key={index}
                                          className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                        >
                                          {subHeader}
                                        </th>
                                      ))}
                                    </tr>
                                  )}
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {unitTypeRows.map((row, rowIndex) => {
                                    // Fixed: Use correct row index for this specific unit type group
                                    const actualRowIndex = startingRowIndex + rowIndex;

                                    return (
                                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {row.map((cell, colIndex) => {
                                          const key = `${actualRowIndex}-${colIndex}`;
                                          const currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                                          const isDisabled =
                                            colIndex === 0 || // SR No
                                            colIndex === 1 || // Mode
                                            colIndex === 3 || // Calculated master (read-only)
                                            colIndex === 4 || // Master value (read-only)
                                            colIndex === 10 || // Average
                                            colIndex === 11; // Error

                                          return (
                                            <td
                                              key={colIndex}
                                              className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                                            >
                                              <input
                                                type="text"
                                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                                                  } ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                                value={currentValue}
                                                onChange={(e) => {
                                                  if (isDisabled) return;
                                                  handleInputChange(actualRowIndex, colIndex, e.target.value);
                                                  // Clear error when user starts typing
                                                  if (observationErrors[key]) {
                                                    setObservationErrors(prev => {
                                                      const newErrors = { ...prev };
                                                      delete newErrors[key];
                                                      return newErrors;
                                                    });
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  if (isDisabled) return;
                                                  handleObservationBlur(actualRowIndex, colIndex, e.target.value);
                                                }}
                                                disabled={isDisabled}
                                              />
                                              {observationErrors[key] && (
                                                <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Original single table rendering for other observation types
                      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                              {tableStructure.headers.map((header, index) => (
                                <th
                                  key={index}
                                  colSpan={header.colspan}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                >
                                  {header.name}
                                </th>
                              ))}
                            </tr>
                            {tableStructure.subHeadersRow.some((item) => item !== null) && (
                              <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                                {tableStructure.subHeadersRow.map((subHeader, index) => (
                                  <th
                                    key={index}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                  >
                                    {subHeader}
                                  </th>
                                ))}
                              </tr>
                            )}
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {(selectedTableData.staticRows?.length > 0
                              ? selectedTableData.staticRows
                              : [Array(tableStructure.subHeadersRow.length).fill('')]
                            ).map((row, rowIndex) => (
                              <React.Fragment key={rowIndex}>
                                {selectedTableData.id === 'observationts' && rowIndex % 5 === 0 && (
                                  <tr className="bg-blue-50 dark:bg-blue-900 border-b border-gray-300 dark:border-gray-600">
                                    <td colSpan="10" className="px-3 py-2 text-left text-sm font-medium text-gray-800 dark:text-white border-r border-gray-300 dark:border-gray-600">
                                      Nominal Size of Sieve: {selectedTableData.hiddenInputs.values[rowIndex]}
                                    </td>
                                  </tr>
                                )}
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  {row.map((cell, colIndex) => {
                                    const key = `${rowIndex}-${colIndex}`;
                                    const currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                                    // ✅ ADD GTM UNIT SELECT HANDLING (BEFORE RTD WI)
                                    if (selectedTableData.id === 'observationgtm' && cell === 'UNIT_SELECT') {
                                      return (
                                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                          <Select
                                            options={unitsList}
                                            className="w-full text-sm"
                                            classNamePrefix="select"
                                            placeholder="Select unit..."
                                            value={unitsList.find(u => u.label === currentValue)}
                                            styles={{
                                              control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                fontSize: '0.875rem'
                                              })
                                            }}
                                            onChange={(selected) => {
                                              handleInputChange(rowIndex, colIndex, selected?.label || '');
                                              handleObservationBlur(rowIndex, colIndex, selected?.value?.toString() || '');
                                            }}
                                          />
                                        </td>
                                      );
                                    }

                                    // ✅ ADD GTM STATIC TEXT HANDLING (BEFORE RTD WI)
                                    if (selectedTableData.id === 'observationgtm' && (cell === '-' || cell === 'UUC' || cell === 'Master')) {
                                      return (
                                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 text-center font-medium">
                                          {cell}
                                        </td>
                                      );
                                    }

                                    // ✅ ADD UC STATIC TEXT HANDLING FOR UNIT TYPE
                                    if (selectedTableData.id === 'observationuc' && colIndex === 1) {
                                      return (
                                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 align-middle">
                                          {cell}
                                        </td>
                                      );
                                    }

                                    // Special handling for UNIT_SELECT in observationrtdwi Master row
                                    if (selectedTableData.id === 'observationrtdwi' && cell === 'UNIT_SELECT') {
                                      return (
                                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                          <Select
                                            options={unitsList}
                                            className="w-full text-sm"
                                            classNamePrefix="select"
                                            placeholder="Select unit..."
                                            value={unitsList.find(u => u.label === currentValue)}
                                            styles={{
                                              control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                fontSize: '0.875rem'
                                              })
                                            }}
                                            onChange={(selected) => {
                                              handleInputChange(rowIndex, colIndex, selected?.label || '');
                                              handleObservationBlur(rowIndex, colIndex, selected?.value?.toString() || '');
                                            }}
                                          />
                                        </td>
                                      );
                                    }


                                    if ((selectedTableData.id === 'observationrtdwi' || selectedTableData.id === 'observationth') && (cell === '-' || cell === 'UUC' || cell === 'Master')) {
                                      return (
                                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 text-center font-medium">
                                          {cell}
                                        </td>
                                      );
                                    }

                                    let isDisabled = colIndex === 0;

                                    if (selectedTableData.id === 'observationrtdwi') {
                                      const rowType = row[2];
                                      isDisabled = isDisabled || [2].includes(colIndex) || cell === '-';
                                      if (rowType === 'UUC') {
                                        isDisabled = isDisabled || [1, 10, 11, 12, 13, 14].includes(colIndex);
                                      }
                                      if (rowType === 'Master') {
                                        if ([11].includes(colIndex)) {
                                          isDisabled = false;
                                        } else if ([0, 1, 4, 12, 13, 14].includes(colIndex)) {
                                          isDisabled = true;
                                        }
                                      }
                                    }

                                    else if (selectedTableData.id === 'observationgtm') {
                                      const rowType = row[2];
                                      isDisabled = isDisabled || [2].includes(colIndex) || cell === '-';
                                      if (rowType === 'UUC') {
                                        // UUC row: SR No, Value Of, Sensitivity Coefficient, Average (Ω), Average (°C), Deviation disabled
                                        isDisabled = isDisabled || [0, 1, 2, 4, 5, 11, 12, 13].includes(colIndex);
                                      }
                                      if (rowType === 'Master') {
                                        // Master row: SR No, Set Point, Value Of, Range, Deviation disabled
                                        isDisabled = isDisabled || [0, 1, 2, 3, 11, 13].includes(colIndex);
                                      }
                                    }// In the table rendering section, add DG disabled fields logic:

                                    else if (selectedTableData.id === 'observationdg') {
                                      // Sr No, and all calculated fields (cols 6-10) are disabled
                                      isDisabled = isDisabled || [0, 1, 6, 7, 8, 9, 10].includes(colIndex);
                                    }
                                    else if (selectedTableData.id === 'observationdpg') {
                                      isDisabled = isDisabled || [1, 2, 6, 7, 8, 9].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationodfm') {
                                      isDisabled = isDisabled || [2, 8, 9].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationppg') {
                                      isDisabled = isDisabled || [1, 2, 9, 10, 11, 12].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationapg') {
                                      isDisabled = isDisabled || [1, 2, 5, 6, 7].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationctg') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationmsr') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationmg') {
                                      isDisabled = isDisabled || [5, 6, 7].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationavg') {
                                      isDisabled = isDisabled || [5, 6, 7].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationit') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationexm') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationfg') {
                                      isDisabled = isDisabled || [7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationhg') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationmt') {
                                      const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex], 10) || 5;
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex) || (colIndex >= 2 && colIndex <= 6 && colIndex >= 2 + repeatableCycle);
                                    } else if (selectedTableData.id === 'observationdw') {
                                      isDisabled = isDisabled || [0, 1, 2, 8, 9].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationts') {
                                      isDisabled = isDisabled || [0, 9].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationth') {
                                      const rowType = row[1];
                                      isDisabled = isDisabled || cell === '-';
                                      if (rowType === 'UUC') {
                                        isDisabled = isDisabled || [0, 1, 3, 4, 10, 11].includes(colIndex);
                                      }
                                      if (rowType === 'Master') {
                                        isDisabled = isDisabled || [0, 1, 2, 3, 4, 10, 11].includes(colIndex);
                                      }
                                    }

                                    let rowSpanVal = undefined;
                                    if (selectedTableData.id === 'observationdw') {
                                      const isSpanCol = [0, 2, 3, 9].includes(colIndex);
                                      if (isSpanCol) {
                                        if (row[1] !== '1') {
                                          return null;
                                        }
                                        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
                                        rowSpanVal = selectedTableData.hiddenInputs?.calibrationPoints?.filter(id => id === calibPointId).length || 1;
                                      }
                                    }

                                    return (
                                      <td
                                        key={colIndex}
                                        rowSpan={rowSpanVal}
                                        className="px-3 py-2 whitespace-nowrap text-sm border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 align-middle"
                                      >
                                        <input
                                          type="text"
                                          className={`w-full min-w-[50px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                                            } ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                          value={currentValue}
                                          onChange={(e) => {
                                            if (isDisabled) return;
                                            handleInputChange(rowIndex, colIndex, e.target.value);
                                            if (observationErrors[key]) {
                                              setObservationErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors[key];
                                                return newErrors;
                                              });
                                            }
                                          }}
                                          onBlur={(e) => {
                                            if (isDisabled) return;
                                            if (selectedTableData.id === 'observationctg' ||
                                              selectedTableData.id === 'observationdpg' ||
                                              selectedTableData.id === 'observationodfm' ||
                                              selectedTableData.id === 'observationmm' ||
                                              selectedTableData.id === 'observationit' ||
                                              selectedTableData.id === 'observationmt' ||
                                              selectedTableData.id === 'observationmg' ||
                                              selectedTableData.id === 'observationfg' ||
                                              selectedTableData.id === 'observationhg' ||
                                              selectedTableData.id === 'observationppg' ||
                                              selectedTableData.id === 'observationexm' ||
                                              selectedTableData.id === 'observationmsr' ||
                                              selectedTableData.id === 'observationgtm' ||
                                              selectedTableData.id === 'observationdg' ||
                                              selectedTableData.id === 'observationdw' ||
                                              selectedTableData.id === 'observationts' ||
                                              selectedTableData.id === 'observationtm' ||
                                              selectedTableData.id === 'observationth' ||
                                              selectedTableData.id === 'observationrtdwi') {
                                              handleObservationBlur(rowIndex, colIndex, e.target.value);
                                            } else {
                                              handleRowSave(rowIndex);
                                            }
                                          }}
                                          disabled={isDisabled}
                                        />
                                        {observationErrors[key] && (
                                          <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {observationTemplate && observations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No observations found for template: {observationTemplate}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Temperature End (°C) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    name="tempend"
                    value={formData.tempend}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    placeholder="Enter temperature range"
                  // required attribute removed
                  />
                  {errors.tempend && <p className="text-red-500 text-xs mt-1">{errors.tempend}</p>}
                  {!errors.tempend && !formData.tempend && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                  {temperatureRange && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Range:{' '}
                      {temperatureRange.min
                        ? `${temperatureRange.min} - ${temperatureRange.max}`
                        : temperatureRange.value || 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Humidity End (%RH) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    name="humiend"
                    value={formData.humiend}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    placeholder="Enter humidity range"
                  // required attribute removed
                  />
                  {errors.humiend && <p className="text-red-500 text-xs mt-1">{errors.humiend}</p>}
                  {!errors.humiend && !formData.humiend && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                  {humidityRange && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Range:{' '}
                      {humidityRange.min
                        ? `${humidityRange.min} - ${humidityRange.max}`
                        : humidityRange.value || 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              {selectedTableData?.id === 'observationdw' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Pressure Start (hpa) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      name="pressurestart"
                      value={formData.pressurestart}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      placeholder="Enter start pressure"
                    />
                    {errors.pressurestart && <p className="text-red-500 text-xs mt-1">{errors.pressurestart}</p>}
                    {!errors.pressurestart && !formData.pressurestart && (
                      <p className="text-red-500 text-xs mt-1">This field is required</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Pressure End (hpa) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      name="pressureend"
                      value={formData.pressureend}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      placeholder="Enter end pressure"
                    />
                    {errors.pressureend && <p className="text-red-500 text-xs mt-1">{errors.pressureend}</p>}
                    {!errors.pressureend && !formData.pressureend && (
                      <p className="text-red-500 text-xs mt-1">This field is required</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Thermal Stabilization (hour) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      name="stabilizationtime"
                      value={formData.stabilizationtime}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      placeholder="Enter stabilization hours"
                    />
                    {errors.stabilizationtime && <p className="text-red-500 text-xs mt-1">{errors.stabilizationtime}</p>}
                    {!errors.stabilizationtime && !formData.stabilizationtime && (
                      <p className="text-red-500 text-xs mt-1">This field is required</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Calibration End Date/Done date:
                  </label>
                  <input
                    type="date"
                    name="enddate"
                    value={formatDateForInput(formData.enddate)}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Suggested Due Date:
                  </label>
                  <input
                    type="date"
                    name="duedate"
                    value={formatDateForInput(formData.duedate)}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes:</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="Enter notes"
                />
              </div>

              <div className="flex justify-end mt-8 mb-4">
                <Button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded font-medium transition-colors"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between px-6 pb-6">
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              ›
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default CalibrateStep3;
