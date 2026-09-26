// Common utility functions for ViewRawData

export const safeGetValue = (item) => {
  if (item === null || item === undefined || item === '') return '';
  if (typeof item === 'object' && item !== null) {
    return item.value !== null && item.value !== undefined ? item.value : '';
  }
  return item.toString();
};

export const safeGetArray = (item, defaultLength = 0) => {
  if (!item) return Array(defaultLength).fill('');
  if (Array.isArray(item)) return item;
  if (typeof item === 'string') return [item];
  return Array(defaultLength).fill('');
};

export const formatValueByLc = (val, decimals, leastCount) => {
  const raw = safeGetValue(val);
  if (raw === null || raw === undefined || raw === '' || raw === 'NA' || raw === 'na') return raw;

  let lcVal = leastCount;
  if (typeof leastCount === 'object' && leastCount !== null) {
    lcVal = leastCount.least_count ?? leastCount.least_count_uuc ?? leastCount.uuc_least_count ?? leastCount.leastcount ?? leastCount.master_least_count ?? leastCount.masterleastcount ?? null;
  }

  let d = null;
  if (decimals !== null && decimals !== undefined && decimals !== 'NA' && decimals !== '') {
    const parsed = parseInt(decimals, 10);
    if (!isNaN(parsed)) d = parsed;
  }
  if (d === null && lcVal !== null && lcVal !== undefined && lcVal !== 'NA' && lcVal !== '') {
    const str = String(lcVal).trim();
    const match = str.match(/\.([0-9]+)/);
    if (match) {
      d = match[1].length;
    } else if (!isNaN(parseFloat(str))) {
      d = 0;
    }
  }
  if (d === null) return raw;

  if (typeof raw === 'string' && raw.includes('/')) {
    return raw.split('/').map((v) => {
      const num = parseFloat(v);
      if (isNaN(num)) return v.trim();
      let res = num.toFixed(d);
      if (parseFloat(res) === 0) res = res.replace(/^-/, '');
      return res;
    }).join('/');
  }

  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  let res = n.toFixed(d);
  if (parseFloat(res) === 0) res = res.replace(/^-/, '');
  return res;
};

export const getObservationValueByType = (point, type, repeatable = 0) => {
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

export const normalizeUtmGroups = (observationData) => {
  const source = Array.isArray(observationData) ? observationData : [observationData].filter(Boolean);
  return source.flatMap((item, index) => {
    const calibrationPoints =
      item?.calibration_points ||
      item?.calibrationPoints ||
      item?.points ||
      item?.observations ||
      (item?.point_id || item?.id ? [item] : []);

    if (Array.isArray(calibrationPoints) && calibrationPoints.length > 0) {
      const additional = item?.additional_data || {};
      const zeroErrorData = item?.zero_error_data || null;
      return [{
        matrixId: safeGetValue(item?.matrix_id ?? item?.matrixid ?? item?.id ?? `matrix-${index + 1}`),
        matrixType: item?.matrixtype || item?.matrix_type || item?.type || item?.name || '',
        leastCount: item?.leastcount ?? item?.least_count ?? additional.least_count ?? item?.matrix?.leastcount,
        minPoint: item?.minpoint ?? item?.min_point ?? additional.min_point,
        maxPoint: item?.maxpoint ?? item?.max_point ?? zeroErrorData?.max_point,
        classOfMachine: item?.classofmachine ?? item?.class_of_machine ?? additional.class_of_machine,
        dialGaugeSetting: item?.dialguageseting ?? item?.dial_gauge_setting ?? additional.dial_gauge_setting,
        zeroErrorData,
        calibrationPoints,
        raw: item,
      }];
    }

    return [];
  });
};

export const applyTemperatureCompensation = (calculatedUuc) => {
  const avgTemp = 23;
  const numCalculatedUuc = parseFloat(calculatedUuc);
  if (!isNaN(numCalculatedUuc) && !isNaN(avgTemp)) {
    const compensated = (0.00027 * (avgTemp - 23) + 1) * numCalculatedUuc;
    return compensated.toFixed(1);
  }
  return calculatedUuc;
};
