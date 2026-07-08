// hooks/useObservations.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axios';

export const useObservations = (observationTemplate, instId, inwardId) => {
  const [observations, setObservations] = useState([]);
  const [leastCountData, setLeastCountData] = useState({});
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });

  // Main fetch function
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

        // Process based on template type
        processObservationData(observationData, observationTemplate);
      } else {
        console.log('No observations found');
        setObservations([]);
      }
    } catch (error) {
      console.error('Error fetching observations:', error);
      setObservations([]);
    }
  }, [observationTemplate, instId, inwardId]);

  // Process observation data based on template
  const processObservationData = (data, template) => {
    switch (template) {
      case 'observationmt':
        processMTData(data);
        break;
      case 'observationodfm':
        processODFMData(data);
        break;
      case 'observationdpg':
        processDPGData(data);
        break;
      case 'observationapg':
        processAPGData(data);
        break;
      case 'observationmm':
        processMMData(data);
        break;
      case 'observationavg':
        processAVGData(data);
        break;
      case 'observationppg':
        processPPGData(data);
        break;
      case 'observationmg':
        processMGData(data);
        break;
      case 'observationrtdwi':
        processRTDWIData(data);
        break;
      case 'observationfg':
        processFGData(data);
        break;
      case 'observationexm':
        processEXMData(data);
        break;
      case 'observationgtm':
        processGTMData(data);
        break;
      case 'observationhg':
        processHGData(data);
        break;
      case 'observationit':
        processITData(data);
        break;
      case 'observationmsr':
        processMSRData(data);
        break;
      case 'observationdg':
        processDGData(data);
        break;
      case 'observationctg':
        processCTGData(data);
        break;
      case 'observationtswoi':
        processTSWOIData(data);
        break;
      default:
        setObservations([]);
    }
  };

  // MT - Measuring Tool
  const processMTData = (data) => {
    const mtData = data.data || data;

    if (mtData.calibration_points) {
      console.log('✅ MT calibration_points found:', mtData.calibration_points);
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
  };

  // ODFM - Flow Meter
  const processODFMData = (data) => {
    if (data.calibration_points) {
      console.log('✅ ODFM calibration_points found:', data.calibration_points);
      setObservations(data.calibration_points);
    } else {
      setObservations([]);
    }
  };

  // DPG - Digital Pressure Gauge
  const processDPGData = (data) => {
    if (data.observations) {
      console.log('✅ DPG observations found:', data.observations);
      setObservations(data.observations);
    } else {
      setObservations([]);
    }
  };

  // APG - Analog Pressure Gauge
  const processAPGData = (data) => {
    console.log('✅ APG data found:', data);
    setObservations(data);
  };

  // MM - Multimeter
  const processMMData = (data) => {
    const leastCountMap = {};

    if (data.calibration_points && Array.isArray(data.calibration_points)) {
      console.log('✅ MM calibration_points found:', data.calibration_points);
      setObservations(data.calibration_points);

      // Extract least count data
      data.calibration_points.forEach(point => {
        if (point.point_id && point.precision) {
          const mode = point.mode?.toLowerCase();
          if (mode === 'source' && point.precision.uuc_least_count) {
            leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
          } else if (mode === 'measure' && point.precision.master_least_count) {
            leastCountMap[point.point_id] = parseFloat(point.precision.master_least_count);
          }
        }
      });
    } else if (data.data && Array.isArray(data.data)) {
      setObservations(data.data);

      data.data.forEach(unitTypeGroup => {
        if (unitTypeGroup.calibration_points) {
          unitTypeGroup.calibration_points.forEach(point => {
            if (point.point_id && point.precision?.uuc_least_count) {
              leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
            }
          });
        }
      });
    } else if (data.unit_types && Array.isArray(data.unit_types)) {
      setObservations(data.unit_types);

      data.unit_types.forEach(unitTypeGroup => {
        if (unitTypeGroup.calibration_points) {
          unitTypeGroup.calibration_points.forEach(point => {
            if (point.point_id && point.precision?.uuc_least_count) {
              leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
            }
          });
        }
      });
    } else if (Array.isArray(data)) {
      setObservations(data);
    } else {
      setObservations([]);
    }

    setLeastCountData(leastCountMap);
    console.log('📊 MM Least Count Map:', leastCountMap);
  };

  // AVG - Analog Vacuum Gauge
  const processAVGData = (data) => {
    const avgData = data.data || data;

    if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
      console.log('✅ AVG calibration_point found:', avgData.calibration_point);
      setObservations(avgData.calibration_point);
    } else {
      console.log('❌ No AVG calibration_point found');
      setObservations([]);
    }
  };

  // PPG - Pneumatic Pressure Gauge
  const processPPGData = (data) => {
    if (data.observations) {
      console.log('✅ PPG observations found:', data.observations);
      setObservations(data.observations);
    } else {
      setObservations([]);
    }
  };

  // MG - Manometer Gauge
  const processMGData = (data) => {
    const mgData = data.data || data;

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
  };

  // RTD WI - RTD With Indicator
  const processRTDWIData = (data) => {
    if (data.calibration_points && Array.isArray(data.calibration_points)) {
      console.log('✅ RTD WI calibration_points found:', data.calibration_points.length, 'points');
      setObservations(data.calibration_points);
    } else {
      console.log('❌ No RTD WI calibration_points found');
      setObservations([]);
    }
  };

  // FG - Force Gauge
  const processFGData = (data) => {
    const fgData = data.data || data;

    if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
      console.log('✅ FG calibration_points found:', fgData.calibration_points);
      setObservations(fgData.calibration_points);

      if (fgData.thermal_coefficients) {
        setThermalCoeff({
          uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
          master: fgData.thermal_coefficients.thermal_coeff_master || '',
          thickness_of_graduation: ''
        });
      }
    } else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
      console.log('✅ FG unit_types found:', fgData.unit_types);
      setObservations(fgData.unit_types);

      if (fgData.thermal_coeff) {
        setThermalCoeff({
          uuc: fgData.thermal_coeff.uuc || '',
          master: fgData.thermal_coeff.master || '',
          thickness_of_graduation: ''
        });
      }
    } else {
      setObservations([]);
    }
  };

  // EXM - External Micrometer
  const processEXMData = (data) => {
    if (data.calibration_points && Array.isArray(data.calibration_points)) {
      console.log('✅ EXM calibration_points found:', data.calibration_points);
      setObservations(data.calibration_points);

      if (data.thermal_coefficients) {
        setThermalCoeff({
          uuc: data.thermal_coefficients.uuc || '',
          master: data.thermal_coefficients.master || '',
          thickness_of_graduation: ''
        });
      }
    } else {
      setObservations([]);
    }
  };

  // GTM - Glass Thermometer
  const processGTMData = (data) => {
    if (data.calibration_points && Array.isArray(data.calibration_points)) {
      console.log('✅ GTM calibration_points found:', data.calibration_points.length, 'points');
      setObservations(data.calibration_points);
    } else {
      console.log('❌ No GTM calibration_points found');
      setObservations([]);
    }
  };

  // HG - Height Gauge
  const processHGData = (data) => {
    const hgData = data[1] || data;

    if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
      console.log('✅ HG calibration_points found:', hgData.calibration_points);
      setObservations(hgData.calibration_points);

      if (data[0] && data[0].thermal_coefficients) {
        setThermalCoeff({
          uuc: data[0].thermal_coefficients.uuc_coefficient || '',
          master: data[0].thermal_coefficients.master_coefficient || '',
          thickness_of_graduation: ''
        });
      }
    } else {
      setObservations([]);
    }
  };

  // IT - Internal Thread
  const processITData = (data) => {
    const itData = data.data || data;

    if (itData.calibration_points) {
      console.log('✅ IT calibration_points found:', itData.calibration_points);
      setObservations(itData.calibration_points);

      if (itData.thermal_coefficients) {
        setThermalCoeff({
          uuc: itData.thermal_coefficients.uuc_coefficient || '',
          master: itData.thermal_coefficients.master_coefficient || '',
          thickness_of_graduation: ''
        });
      }
    } else {
      setObservations([]);
    }
  };

  // MSR - Measuring Scale Ruler
  const processMSRData = (data) => {
    if (Array.isArray(data) && data.length > 0) {
      const msrData = data[0];

      if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
        console.log('✅ MSR calibration_points found:', msrData.calibration_points);
        setObservations(msrData.calibration_points);

        if (msrData.thermal_coeff) {
          setThermalCoeff({
            uuc: msrData.thermal_coeff.uuc || '',
            master: msrData.thermal_coeff.master || '',
            thickness_of_graduation: ''
          });
        }
      } else {
        setObservations([]);
      }
    } else {
      setObservations([]);
    }
  };

  // DG - Digital Gauge
  const processDGData = (data) => {
    if (data.observations && Array.isArray(data.observations)) {
      console.log('✅ DG observations found:', data.observations);
      setObservations(data.observations);
    } else if (Array.isArray(data)) {
      console.log('✅ DG observations as array:', data);
      setObservations(data);
    } else {
      console.log('❌ No DG observations found');
      setObservations([]);
    }

    if (data.thermal_coefficients) {
      setThermalCoeff({
        uuc: data.thermal_coefficients.uuc || '',
        master: data.thermal_coefficients.master || '',
        thickness_of_graduation: ''
      });
    }
  };

  // CTG - Contact Type Gauge
  const processCTGData = (data) => {
    if (data.points) {
      console.log('✅ CTG points found:', data.points);
      setObservations(data.points);

      // Extract least count data
      const leastCountMap = {};
      data.points.forEach(point => {
        if (point.id && point.least_count) {
          leastCountMap[point.id] = parseFloat(point.least_count);
        }
      });

      setLeastCountData(leastCountMap);
      console.log('📊 CTG Least Count Map:', leastCountMap);

      if (data.thermal_coeff) {
        setThermalCoeff({
          uuc: data.thermal_coeff.uuc || '',
          master: data.thermal_coeff.master || '',
          thickness_of_graduation: ''
        });
      }
    } else {
      setObservations([]);
    }
  };

  // TSWOI - Temperature Sensor Without Indicator
  const processTSWOIData = (data) => {
    const tswoiData = data.data || data;

    if (tswoiData.calibration_points && Array.isArray(tswoiData.calibration_points)) {
      console.log('✅ TSWOI calibration_points found:', tswoiData.calibration_points);
      setObservations(tswoiData.calibration_points);
    } else if (tswoiData.points && Array.isArray(tswoiData.points)) {
      console.log('✅ TSWOI points found:', tswoiData.points);
      setObservations(tswoiData.points);
    } else if (Array.isArray(tswoiData)) {
      console.log('✅ TSWOI data array found:', tswoiData);
      setObservations(tswoiData);
    } else if (tswoiData.observations && Array.isArray(tswoiData.observations)) {
      console.log('✅ TSWOI observations found:', tswoiData.observations);
      setObservations(tswoiData.observations);
    } else {
      console.log('❌ No TSWOI observations found');
      setObservations([]);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  // Return hook values and functions
  return {
    observations,
    setObservations,
    leastCountData,
    setLeastCountData,
    thermalCoeff,
    setThermalCoeff,
    refetchObservations: fetchObservations
  };
};