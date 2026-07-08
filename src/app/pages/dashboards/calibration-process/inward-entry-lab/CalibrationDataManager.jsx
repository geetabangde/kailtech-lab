// ==========================================
// CalibrationDataManager.jsx
// ==========================================
import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axios';
import { toast } from 'sonner';
import { JWT_HOST_API } from "configs/auth.config";

export const CalibrationDataManager = ({ 
  inwardId, 
  instId, 
  caliblocation, 
  calibacc,
  observationTemplate,
  onDataLoaded 
}) => {
  const [instrument, setInstrument] = useState(null);
  const [inwardEntry, setInwardEntry] = useState(null);
  const [masters, setMasters] = useState([]);
  const [supportMasters, setSupportMasters] = useState([]);
  const [temperatureRange, setTemperatureRange] = useState(null);
  const [humidityRange, setHumidityRange] = useState(null);
  const [observations, setObservations] = useState([]);
  const [leastCountData, setLeastCountData] = useState({});
  const [dynamicHeadings, setDynamicHeadings] = useState(null);
  const [suffix, setSuffix] = useState('');
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });
  const [unitsList, setUnitsList] = useState([]);

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

  const fetchDynamicHeadings = useCallback(async (suffix) => {
    if (!suffix) return null;

    try {
      const response = await axios.post(
        '/observationsetting/get-custome-observation',
        { inwardid: inwardId, instid: instId, suffix: suffix }
      );
      
      console.log('Response from dynamic headings fetch:', response.data);

      if (response.data.status === true && response.data.heading) {
        return response.data.heading;
      }
      return null;
    } catch (error) {
      console.error('Error fetching dynamic headings:', error);
      return null;
    }
  }, [instId, inwardId]);

  // Fetch units
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

    if (observationTemplate === 'observationrtdwi' || observationTemplate === 'observationgtm') {
      fetchUnits();
    }
  }, [observationTemplate]);

  // Fetch calibration step 3 details
  useEffect(() => {
    axios
      .get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
        params: { inward_id: inwardId, instid: instId, caliblocation, calibacc },
      })
      .then((res) => {
        const data = res.data;

        setInwardEntry(data.inwardEntry);
        setInstrument(data.instrument);
        setMasters(data.masters || []);
        setSupportMasters(data.supportMasters || []);
        setTemperatureRange(data.temperatureRange);
        setHumidityRange(data.humidityRange);

        if (data.listOfInstrument?.suffix) {
          setSuffix(data.listOfInstrument.suffix);
          fetchDynamicHeadings(data.listOfInstrument.suffix).then(headings => {
            setDynamicHeadings(headings);
          });
        }

        const formattedData = {
          enddate: formatDateForInput(data.instrument?.enddate),
          humiend: data.instrument?.humiend || '',
          tempend: data.instrument?.tempend || '',
          duedate: formatDateForInput(data.instrument?.duedate),
          temperatureEnd: data.temperatureRange?.min && data.temperatureRange?.max
            ? `${data.temperatureRange.min} - ${data.temperatureRange.max}`
            : data.temperatureRange?.value || '',
          humidityEnd: data.humidityRange?.min && data.humidityRange?.max
            ? `${data.humidityRange.min} - ${data.humidityRange.max}`
            : data.humidityRange?.value || '',
        };

        onDataLoaded({
          instrument: data.instrument,
          inwardEntry: data.inwardEntry,
          masters: data.masters,
          supportMasters: data.supportMasters,
          temperatureRange: data.temperatureRange,
          humidityRange: data.humidityRange,
          formattedData,
        });
      })
      .catch((err) => {
        console.error('❌ API Error:', err.response?.data || err);
        toast.error('Failed to fetch calibration data');
      });
  }, [inwardId, instId, caliblocation, calibacc, fetchDynamicHeadings, onDataLoaded]);

  // Fetch observations
  useEffect(() => {
    const fetchObservations = async () => {
      if (!observationTemplate) return;

      try {
        const response = await axios.post(
          'https://kailtech.in/newlims/api/ob/get-observation',
          { fn: observationTemplate, instid: instId, inwardid: inwardId }
        );

        const isSuccess = response.data.status === true || response.data.staus === true;

        if (isSuccess && response.data.data) {
          const observationData = response.data.data;

          if (observationData.thermal_coeff || observationData.thermal_coefficients) {
            const thermalData = observationData.thermal_coeff || observationData.thermal_coefficients;
            setThermalCoeff({
              uuc: thermalData.uuc || thermalData.uuc_coefficient || '',
              master: thermalData.master || thermalData.master_coefficient || '',
              thickness_of_graduation: thermalData.thickness_of_graduation || '',
            });
          }

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

          const leastCountMap = {};
          calibrationPoints.forEach(point => {
            if (point.point_id && point.precision?.uuc_least_count) {
              leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
            } else if (point.id && point.least_count) {
              leastCountMap[point.id] = parseFloat(point.least_count);
            }
          });
          setLeastCountData(leastCountMap);
        } else {
          setObservations([]);
        }
      } catch (error) {
        console.log('Error fetching observations:', error);
        setObservations([]);
      }
    };

    fetchObservations();
  }, [observationTemplate, instId, inwardId]);

  const refetchObservations = async () => {
    if (!observationTemplate) return;

    try {
      const response = await axios.post(
        'https://kailtech.in/newlims/api/ob/get-observation',
        { fn: observationTemplate, instid: instId, inwardid: inwardId }
      );

      const isSuccess = response.data.status === true || response.data.staus === true;

      if (isSuccess && response.data.data) {
        const observationData = response.data.data;

        if (observationData.thermal_coeff || observationData.thermal_coefficients) {
          const thermalData = observationData.thermal_coeff || observationData.thermal_coefficients;
          setThermalCoeff({
            uuc: thermalData.uuc || thermalData.uuc_coefficient || '',
            master: thermalData.master || thermalData.master_coefficient || '',
            thickness_of_graduation: thermalData.thickness_of_graduation || '',
          });
        }

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
      }
    } catch (error) {
      console.log('Error refetching observations:', error);
    }
  };

  return {
    instrument,
    inwardEntry,
    masters,
    supportMasters,
    temperatureRange,
    humidityRange,
    observations,
    leastCountData,
    dynamicHeadings,
    suffix,
    thermalCoeff,
    setThermalCoeff,
    unitsList,
    refetchObservations,
  };
};