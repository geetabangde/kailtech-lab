/**
 * Common utilities for observation calculations and table row generation.
 */

export const safeGetValue = (item) => {
  if (item === undefined || item === null || item === '') return '';
  if (typeof item === 'object' && item !== null) {
    const val = item.value !== null && item.value !== undefined ? item.value : (item.val ?? item.reading ?? '');
    return (val !== undefined && val !== null) ? val.toString() : '';
  }
  return item.toString();
};

export const safeGetArray = (item, defaultLength = 0) => {
  if (!item) return Array(defaultLength).fill('');
  if (Array.isArray(item)) {
    const arr = item.map(x => safeGetValue(x));
    while (arr.length < defaultLength) arr.push('');
    return arr;
  }
  if (typeof item === 'string') {
    const arr = [item];
    while (arr.length < defaultLength) arr.push('');
    return arr;
  }
  if (typeof item === 'object') {
    const arr = Object.values(item).map(x => safeGetValue(x));
    while (arr.length < defaultLength) arr.push('');
    return arr;
  }
  return Array(defaultLength).fill('');
};

export const getDecimalPlaces = (leastCount) => {
  if (!leastCount || leastCount === 'NA') return 0;
  const s = String(leastCount).trim();
  if (s.includes('.')) return s.split('.')[1].length;
  return 0;
};

export const formatValueByLc = (val, decimals, leastCount) => {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'string' && val.includes('/')) return val;

  const strVal = String(val).trim();
  const n = parseFloat(strVal);
  if (isNaN(n)) return val;

  let d = null;
  if (decimals != null && decimals !== 'NA' && decimals !== '') {
    const p = parseInt(decimals, 10);
    if (!isNaN(p)) d = p;
  }
  if (d === null && leastCount != null && leastCount !== 'NA' && leastCount !== '') {
    const s = String(leastCount).trim();
    if (s.includes('.')) d = s.split('.')[1].length;
  }

  if (leastCount != null && leastCount !== 'NA' && leastCount !== '') {
    const lc = parseFloat(String(leastCount).trim());
    if (!isNaN(lc) && lc > 0) {
      const quotient = n / lc;
      const floored = Math.floor(quotient);
      const remainder = quotient - floored;

      let rounded;
      if (remainder < 0.5) {
        rounded = floored;
      } else if (remainder > 0.5) {
        rounded = floored + 1;
      } else {
        rounded = (floored % 2 === 0) ? floored : floored + 1;
      }

      const result = rounded * lc;
      if (d !== null) {
        return result.toFixed(d);
      }
      return String(result);
    }
  }

  if (d !== null) {
    const multiplier = Math.pow(10, d);
    const scaled = n * multiplier;
    const floored = Math.floor(scaled);
    const remainder = scaled - floored;

    let rounded;
    if (remainder < 0.5) {
      rounded = floored;
    } else if (remainder > 0.5) {
      rounded = floored + 1;
    } else {
      rounded = (floored % 2 === 0) ? floored : floored + 1;
    }

    return (rounded / multiplier).toFixed(d);
  }
  return strVal;
};

export const validateLeastCount = (val, leastCount) => {
  if (val === undefined || val === null || String(val).trim() === '') return { isValid: true, error: null };
  const strVal = String(val).trim();
  if (!/^-?\d*\.?\d*$/.test(strVal)) return { isValid: false, error: 'Please enter a valid number' };
  const num = parseFloat(strVal);
  if (isNaN(num)) return { isValid: false, error: 'Please enter a valid number' };

  const lcStr = String(leastCount).trim();
  const lcNum = parseFloat(lcStr);
  const lcDec = (lcStr.includes('.') ? lcStr.split('.')[1].length : 3);

  const valDec = strVal.includes('.') ? strVal.split('.')[1].length : 0;
  if (lcDec >= 0 && valDec > lcDec) {
    return { isValid: false, error: `Maximum ${lcDec} decimal place(s) allowed for least count ${lcStr}` };
  }

  if (num !== 0 && !strVal.endsWith('.') && (!strVal.includes('.') || valDec >= lcDec) && lcNum > 0) {
    if (num < lcNum) {
      return { isValid: false, error: `Please enter a value with in leastcount ${lcStr}` };
    }
    const factor = 1000000;
    const scaledVal = Math.round(num * factor);
    const scaledLc = Math.round(lcNum * factor);
    if (scaledVal % scaledLc !== 0) {
      return { isValid: false, error: `Please Enter Value divisible by ${lcStr}` };
    }
  }

  return { isValid: true, error: null };
};
