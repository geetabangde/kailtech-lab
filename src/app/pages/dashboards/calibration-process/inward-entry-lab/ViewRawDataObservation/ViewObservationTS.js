import { safeGetValue, formatValueByLc } from './viewRawDataUtils';
export { TSTable } from './TSTable';

export const tsTableConfig = {
  id: 'observationts',
  name: 'Observation TS',
  category: 'Test Sieve',
  structure: {
    thermalCoeff: true,
    singleHeaders: ['Sr no'],
    subHeaders: {
      'Aperture Size on Warp Side(in µm/mm)': [
        'Aperture Size (1)',
        'Aperture Size (2)',
        'Aperture Size (3)',
        'Aperture Size (4)',
      ],
      'Aperture Size on Weft Side(in µm/mm)': [
        'Aperture Size (1)',
        'Aperture Size (2)',
        'Aperture Size (3)',
        'Aperture Size (4)',
      ],
    },
    remainingHeaders: ['Average Aperture'],
  },
};

export const createTSRows = (dataArray, hiddenInputs) => {
  const rows = [];
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return rows;
  }

  dataArray.forEach((pointData, pointIdx) => {
    if (!pointData) return;

    const leastCount = pointData.master_matrix?.leastcount || pointData.matrix?.leastcount || pointData.least_count || '0.01';
    const nominalSize = safeGetValue(pointData.nominal_size || pointData.point || pointData.nominal_value || pointData.setpoint || pointData.testpoint || '');

    if (pointData.readings && Array.isArray(pointData.readings)) {
      pointData.readings.forEach((reading, readingIdx) => {
        if (!reading) return;

        const values = reading.values || [];
        const extractedValues = values.map((v) => {
          let val = '';
          if (typeof v === 'object' && v !== null) {
            val = v.value ?? '';
          } else {
            val = v ?? '';
          }
          return formatValueByLc(val, null, leastCount);
        });

        while (extractedValues.length < 8) {
          extractedValues.push('');
        }

        const numericReadings = extractedValues.slice(0, 8).map((v) => parseFloat(v)).filter((n) => !isNaN(n));
        let calculatedAvg = '';
        if (reading.average !== undefined && reading.average !== null && reading.average !== '') {
          calculatedAvg = formatValueByLc(reading.average, null, leastCount);
        } else if (numericReadings.length > 0) {
          calculatedAvg = formatValueByLc(numericReadings.reduce((sum, n) => sum + n, 0) / numericReadings.length, null, leastCount);
        }

        const row = [
          (reading.row || (readingIdx + 1)).toString(),
          ...extractedValues.slice(0, 8),
          calculatedAvg,
        ];

        rows.push(row);
        if (hiddenInputs) {
          hiddenInputs.values.push(nominalSize);
          hiddenInputs.calibrationPoints.push(pointData.id || pointData.calibration_point_id || pointIdx);
          hiddenInputs.repeatables.push(readingIdx.toString());
        }
      });
    } else if (pointData.observations && Array.isArray(pointData.observations)) {
      for (let rc = 0; rc < 5; rc++) {
        const rowValues = [];
        for (let i = 0; i < 8; i++) {
          let obsValue = '';
          const obs = pointData.observations.find((o) => o != null && String(o.repeatable) === `${rc}-${i}`);
          if (obs) obsValue = obs.value;
          rowValues.push(formatValueByLc(obsValue, null, leastCount));
        }

        const numericReadings = rowValues.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
        let calculatedAvg = '';
        if (pointData.readings && Array.isArray(pointData.readings) && pointData.readings[rc]?.average != null && pointData.readings[rc].average !== '') {
          calculatedAvg = formatValueByLc(pointData.readings[rc].average, null, leastCount);
        } else if (pointData.averages && Array.isArray(pointData.averages)) {
          const avg = pointData.averages.find((a) => a != null && String(a.repeatable) === `${rc}`);
          if (avg) calculatedAvg = formatValueByLc(avg.value, null, leastCount);
        } else if (numericReadings.length > 0) {
          calculatedAvg = formatValueByLc(numericReadings.reduce((sum, n) => sum + n, 0) / numericReadings.length, null, leastCount);
        }

        const row = [
          (rc + 1).toString(),
          ...rowValues,
          calculatedAvg,
        ];

        rows.push(row);
        if (hiddenInputs) {
          hiddenInputs.values.push(nominalSize);
          hiddenInputs.calibrationPoints.push(pointData.id || pointData.calibration_point_id || pointIdx);
          hiddenInputs.repeatables.push(rc.toString());
        }
      }
    } else if (pointData.values && Array.isArray(pointData.values)) {
      const values = pointData.values || [];
      const extractedValues = values.map((v) => {
        let val = '';
        if (typeof v === 'object' && v !== null) {
          val = v.value ?? '';
        } else {
          val = v ?? '';
        }
        return formatValueByLc(val, null, leastCount);
      });
      while (extractedValues.length < 8) extractedValues.push('');

      const numericReadings = extractedValues.slice(0, 8).map((v) => parseFloat(v)).filter((n) => !isNaN(n));
      let calculatedAvg = '';
      if (numericReadings.length > 0) {
        calculatedAvg = (numericReadings.reduce((sum, n) => sum + n, 0) / numericReadings.length).toFixed(2);
      } else if (pointData.average !== undefined && pointData.average !== null && pointData.average !== '') {
        calculatedAvg = formatValueByLc(pointData.average, null, leastCount);
      }

      const row = [
        (pointData.row || (pointIdx + 1)).toString(),
        ...extractedValues.slice(0, 8),
        calculatedAvg,
      ];
      rows.push(row);
      if (hiddenInputs) {
        hiddenInputs.values.push(nominalSize);
        hiddenInputs.calibrationPoints.push(pointIdx);
        hiddenInputs.repeatables.push(pointIdx.toString());
      }
    }
  });

  return rows;
};

export const parseTSDynamicData = (observationData, response, setThermalCoeff) => {
  const uucCoeff = observationData?.thermal_coefficient_uuc ?? observationData?.thermal_coefficients?.uuc ?? observationData?.thermal_coeff?.uuc ?? response?.data?.thermal_coefficient_uuc ?? response?.data?.thermal_coefficients?.uuc ?? response?.data?.thermal_coeff?.uuc ?? '';
  const masterCoeff = observationData?.thermal_coefficient_master ?? observationData?.thermal_coefficients?.master ?? observationData?.thermal_coeff?.master ?? response?.data?.thermal_coefficient_master ?? response?.data?.thermal_coefficients?.master ?? response?.data?.thermal_coeff?.master ?? '';
  if ((uucCoeff || masterCoeff) && setThermalCoeff) {
    setThermalCoeff((prev) => ({
      ...prev,
      uuc: uucCoeff,
      master: masterCoeff,
    }));
  }

  if (Array.isArray(observationData)) {
    return observationData;
  } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
    return observationData.calibration_points;
  } else if (observationData.data && Array.isArray(observationData.data)) {
    return observationData.data;
  } else if (observationData.readings && Array.isArray(observationData.readings)) {
    return observationData.readings;
  } else if (typeof observationData === 'object' && observationData !== null) {
    const readings = [];
    Object.keys(observationData).forEach((key) => {
      if (!isNaN(key) && observationData[key]) {
        readings.push(observationData[key]);
      }
    });
    return readings;
  }
  return [];
};
