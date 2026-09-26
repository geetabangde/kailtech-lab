

// This is all new file jisme mene ctg and mm me validation lagaya hai ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Page } from 'components/shared/Page';
import { Button } from 'components/ui/Button';
import { toast } from 'sonner';
import axios from 'utils/axios';
import Select from 'react-select';
import { JWT_HOST_API } from "configs/auth.config";
import { Flatpickr } from "components/shared/form/Flatpickr";
import "flatpickr/dist/themes/light.css";
import ObservationBiomedical from './Observations/ObservationBiomedical';
import ObservationVC, { calculateVCValues } from './Observations/ObservationVC';
import ObservationAPG, { calculateAPGValues, createAPGRows, getAPGTableConfig } from './Observations/ObservationAPG';
import ObservationUTM, { calculateUTMValues } from './Observations/ObservationUTM';
import ObservationAUTM from './Observations/ObservationAUTM';
import ObservationCustom, { calculateCustomValues } from './Observations/ObservationCustom';
import ObservationEXM, { calculateEXMValues } from './Observations/ObservationEXM';
import ObservationWBN, { calculateWBNValues } from './Observations/ObservationWBN';
import ObservationWB, { calculateWBValues } from './Observations/ObservationWB';
import ObservationDW, { calculateDWValues, createDWRows, getDWTableConfig } from './Observations/ObservationDW';
import { calculateTSValues, createTSRows, getTSTableConfig } from './Observations/ObservationTS';
import { calculateDPGValues, createDPGRows, getDPGTableConfig } from './Observations/ObservationDPG';
import { calculateTHValues, createTHRows, getTHTableConfig } from './Observations/ObservationTH';
import ObservationVOLNL, { calculateVOLNLValues, getVOLNLTableConfig, VOLNL_COLUMNS, VOLNL_MAX_REPEATABLE } from './Observations/ObservationVOLNL';
import ObservationVOL, { calculateVOLValues, getVOLTableConfig, VOL_COLUMNS, VOL_MAX_REPEATABLE } from './Observations/ObservationVOL';
import ObservationVHT, { getVHTTableConfig, VHT_COLUMNS, VHT_MAX_REPEATABLE } from './Observations/ObservationVHT';
import { calculateMTValues, createMTRows, getMTTableConfig } from './Observations/ObservationMT';
import { calculateCTGValues, createCTGRows, getCTGTableConfig } from './Observations/ObservationCTG';
import { calculateFGValues, createFGRows, getFGTableConfig } from './Observations/ObservationFG';
import { calculateMSRValues, createMSRRows, getMSRTableConfig } from './Observations/ObservationMSR';
import { calculateHGValues, createHGRows, getHGTableConfig } from './Observations/ObservationHG';
import { calculateITValues, createITRows, getITTableConfig } from './Observations/ObservationIT';
import { calculateTMValues, createTMRows, getTMTableConfig } from './Observations/ObservationTM';
import { calculateUCValues, createUCRows, getUCTableConfig } from './Observations/ObservationUC';
import { calculateMMValues, createMMRows, getMMTableConfig } from './Observations/ObservationMM';
import { calculateRTDWIValues, createRTDWIRows, getRTDWITableConfig } from './Observations/ObservationRTDWI';
import {
  TSWOI_COLS,
  calculateTSWOIValues,
  calculateTSWOIPoint,
  createTSWOIRows,
  extractTSWOIPoints,
  getTSWOIFieldType,
  getTSWOIRowType,
  getTSWOITableConfig,
  isTSWOICellEditable,
  validateTSWOIRow,
} from './Observations/ObservationTSWOI';
import {
  TSWI_COLS,
  calculateTSWIValues,
  calculateTSWIPoint,
  createTSWIRows,
  extractTSWIPoints,
  getTSWIFieldType,
  getTSWIReadingLeastCount,
  getTSWIRowType,
  getTSWITableConfig,
  isTSWICellEditable,
  validateTSWIRow,
} from './Observations/ObservationTSWI';
import {
  SW_COLS,
  calculateSWAverage,
  calculateSWError,
  createSWRows,
  extractSWPoints,
  getSWFieldType,
  getSWReadingLeastCount,
  getSWRowType,
  getSWTableConfig,
  isSWCellEditable,
  isSWReadingColumn,
  validateSWRow,
} from './Observations/ObservationSW';
import {
  SUTM_COLS,
  createSUTMRows,
  extractSUTMPoints,
  getSUTMCalculatedCells,
  getSUTMFieldType,
  getSUTMTableConfig,
  isSUTMCellEditable,
  isSUTMInputColumn,
  validateSUTMRow,
} from './Observations/ObservationSUTM';
import ObservationGTM, { calculateGTMValues, createGTMRows, getGTMTableConfig } from './Observations/ObservationGTM';
import ObservationPR, { calculatePRValues, createPRRows, getPRTableConfig } from './Observations/ObservationPR';
import ObservationUpload from './Observations/ObservationUpload';
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
  const [volnlInstrumentData, setVolnlInstrumentData] = useState({});
  const [volInstrumentData, setVolInstrumentData] = useState({});
  const [tableInputValues, setTableInputValues] = useState({});
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });
  const [parallelism, setParallelism] = useState({
    parallinternal: '',
    parallexternal: '',
  });
  const [biomedicalConfig, setBiomedicalConfig] = useState(null);
  const [uploadData, setUploadData] = useState({});
  const [uploadFile, setUploadFile] = useState(null);

  const isYes = (val) => String(val || '').trim().toLowerCase() === 'yes';

  const isBiomedical = observationTemplate === 'observationbiomedical' || isYes(biomedicalConfig?.biomedical ?? instrument?.biomedical);

  const isDW = observationTemplate === 'observationdw';

  const isVisualTestVisible = isBiomedical &&
    isYes(biomedicalConfig?.show_visual_test ?? instrument?.showvisualtest) &&
    (visualTests && visualTests.length > 0);

  const isBasicSafetyVisible = isBiomedical &&
    isYes(biomedicalConfig?.show_basic_safety ?? instrument?.showbasicsafety) &&
    (safetyTests && safetyTests.length > 0);

  const isElectricalSafetyVisible = isBiomedical &&
    isYes(biomedicalConfig?.show_electrical_safety ?? instrument?.showelectricalsafety);

  const isPerformanceVisible = isBiomedical &&
    isYes((biomedicalConfig?.show_performance ?? biomedicalConfig?.show_performance_test) ?? instrument?.showperformancetest);

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

  const seedTableInputsFromPoints = (points) => {
    if (!Array.isArray(points) || points.length === 0) return;
    setTableInputValues(prev => {
      const updated = { ...prev };
      points.forEach((point, idx) => {
        const nominal = point.nominal_value ?? point.master_value ?? point.test_point;
        if (nominal !== undefined && nominal !== null && nominal !== '') {
          updated[`${idx}-1`] = String(nominal);
        }
        if (Array.isArray(point.observations)) {
          point.observations.forEach((obs, obsIdx) => {
            if (obs !== undefined && obs !== null && obs !== '') {
              updated[`${idx}-${obsIdx + 2}`] = String(obs);
            }
          });
        }
        if (point.average !== undefined && point.average !== null && point.average !== '') {
          updated[`${idx}-7`] = String(point.average);
        }
        if (point.error !== undefined && point.error !== null && point.error !== '') {
          updated[`${idx}-8`] = String(point.error);
        }
      });
      return updated;
    });
  };

  // Helper to sanitize sieve observation inputs (strips letters, multiple dots, extra decimals)
  const sanitizeSieveVal = (val, maxDec = 2) => {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    if (str === '') return '';
    str = str.replace(/[^\d.]/g, '');
    const parts = str.split('.');
    if (parts.length > 1) {
      const intPart = parts[0] || '0';
      const decPart = parts.slice(1).join('');
      str = maxDec !== undefined && maxDec >= 0 ? `${intPart}.${decPart.slice(0, maxDec)}` : `${intPart}.${decPart}`;
    }
    return str;
  };

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

  // Helper function to safely format datetime for input
  const formatDateTimeForInput = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') return '';
    try {
      const normalizedStr = typeof dateString === 'string' && dateString.includes(' ') && !dateString.includes('T')
        ? dateString.replace(' ', 'T')
        : dateString;
      const date = new Date(normalizedStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      console.warn('Invalid date format:', dateString);
      return '';
    }
  };

  const formatValueByLc = (val, decimals, leastCount) => {
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

  const getDecimalPlaces = (leastCount) => {
    if (!leastCount || leastCount === 'NA') return 0;
    const s = String(leastCount).trim();
    if (s.includes('.')) return s.split('.')[1].length;
    return 0;
  };

  // observationcustom only: the template's layout settings, kept separately because
  // the main instrument fetch replaces the whole `instrument` object
  const [customSettings, setCustomSettings] = useState(null);

  // observationcustom only: instrument merged with its template settings
  const getCustomInstrument = () => (
    (instrument && instrument.mastertoshow !== undefined)
      ? instrument
      : { ...(instrument || {}), ...(customSettings || {}) }
  );

  const [unitsList, setUnitsList] = useState([]);
  const [diagram, setDiagram] = useState('');


  // Helper function to calculate due date from enddate and calibration validity
  const calculateDueDate = (startDateStr, frequency) => {
    if (!startDateStr || !frequency || frequency === 'NA') return '';
    try {
      const dateOnlyStr = startDateStr.includes('T')
        ? startDateStr.split('T')[0]
        : (startDateStr.includes(' ') ? startDateStr.split(' ')[0] : startDateStr);
      const startDate = new Date(dateOnlyStr);
      if (isNaN(startDate.getTime())) return '';
      const freq = frequency.toLowerCase().trim();
      const match = freq.match(/^(\d+)\s*(year|years|month|months|day|days)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const unit = match[2];
        const result = new Date(startDate);
        if (unit.startsWith('year')) {
          result.setFullYear(result.getFullYear() + num);
        } else if (unit.startsWith('month')) {
          result.setMonth(result.getMonth() + num);
        } else if (unit.startsWith('day')) {
          result.setDate(result.getDate() + num);
        }
        return formatDateForInput(result);
      }
      const result = new Date(startDate);
      result.setFullYear(result.getFullYear() + 1);
      return formatDateForInput(result);
    } catch {
      return '';
    }
  };

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
    if (observationTemplate === 'observationrtdwi' || observationTemplate === 'observationgtm' || observationTemplate === 'observationtswoi' || observationTemplate === 'observationtswi') {
      fetchUnits();
    }
  }, [observationTemplate]);

  useEffect(() => {
    axios
      .get(`${JWT_HOST_API}/calibrationprocess/get-calibration-step3-details`, {
        params: {
          inward_id: inwardId,
          instid: instId,
          caliblocation: caliblocation,
          calibacc: calibacc,
        },
      })
      .then((res) => {
        const data = res.data;

        setInwardEntry(data.inwardEntry);
        setInstrument(data.instrument);
        setMasters(data.masters || []);
        setSupportMasters(data.supportMasters || []);
        setObservationTemplate(data.observationTemplate);
        setTemperatureRange(data.temperatureRange);
        setHumidityRange(data.humidityRange);
        const initVisual = data.visual_test || data.visual_inspection || [];
        setVisualTests(initVisual);
        if (initVisual.length > 0) {
          const initVt = {};
          initVisual.forEach((t, i) => {
            const val = t.value ?? t.remark ?? '';
            const k = (t.id !== undefined && t.id !== null) ? t.id : i;
            initVt[k] = val;
          });
          setVisualTestInputs(prev => ({ ...initVt, ...prev }));
        }

        const initSafety = data.basic_safety || data.basic_safety_test || [];
        setSafetyTests(initSafety);
        if (initSafety.length > 0) {
          const initSt = {};
          initSafety.forEach((t, i) => {
            const val = typeof t.value === 'object' && t.value !== null ? (t.value.value ?? '') : (t.value ?? '');
            const k = (t.id !== undefined && t.id !== null) ? t.id : i;
            initSt[k] = val;
          });
          setSafetyTestInputs(prev => ({ ...initSt, ...prev }));
        }

        if (data.instrument?.daigram) {
          setDiagram(data.instrument.daigram);
        } else if (data.instrument?.diagram) {
          setDiagram(data.instrument.diagram);
        }

        const initialEndDate = formatDateTimeForInput(data.instrument?.enddate) || formatDateTimeForInput(new Date());
        let initialDueDate = formatDateForInput(data.instrument?.duedate);
        if (!initialDueDate && initialEndDate && data.instrument?.calibrationvalidity) {
          initialDueDate = calculateDueDate(initialEndDate, data.instrument.calibrationvalidity);
        }

        setFormData((prev) => ({
          ...prev,
          enddate: initialEndDate,
          humiend: data.instrument?.humiend || '',
          tempend: data.instrument?.tempend || '',
          duedate: initialDueDate || '',
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
        // if (observationTemplate === 'observationutm') {
        //   const startTemp = parseFloat(data.inwardEntry?.temperature) || 0;
        //   const endTemp = parseFloat(data.instrument?.tempend) || 0;
        //   if (startTemp && endTemp) {
        //     setRoomTemperature(((startTemp + endTemp) / 2).toFixed(1));
        //   }
        // }
      })
      .catch((err) => {
        console.error('❌ API Error:', err.response?.data || err);
        toast.error('Failed to fetch calibration data');
      });
  }, [inwardId, instId, caliblocation, calibacc]); // eslint-disable-line react-hooks/exhaustive-deps

  const safeGetValue = (item) => {
    if (item === undefined || item === null || item === '') return '';
    if (typeof item === 'object' && item !== null) {
      const val = item.value !== null && item.value !== undefined ? item.value : (item.val ?? item.reading ?? '');
      return (val !== undefined && val !== null) ? val.toString() : '';
    }
    return item.toString();
  };

  const safeGetArray = (item, defaultLength = 0) => {
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

  const extractPointValue = (point, type, repeatable = null) => {
    if (!point) return '';
    const repStr = repeatable !== null && repeatable !== undefined ? repeatable.toString() : null;
    const typeLower = type.toLowerCase();

    // 1. Check point.summary_data when it is an Object: e.g. { master: [...], parameter: [...], ... }
    if (point.summary_data && typeof point.summary_data === 'object') {
      if (Array.isArray(point.summary_data)) {
        const match = point.summary_data.find(item => {
          if (!item || typeof item !== 'object') return false;
          const itemType = (item.type || item.obs_type || item.key || '').toString().toLowerCase();
          if (itemType !== typeLower) return false;
          if (repStr === null) return true;
          const itemRep = (item.repeatable ?? item.rep ?? item.cycle ?? '0').toString();
          return itemRep === repStr;
        });
        if (match && match.value !== undefined && match.value !== null && match.value !== '') {
          return safeGetValue(match.value);
        }
      } else {
        const typeArray = point.summary_data[typeLower] ?? point.summary_data[type];
        if (Array.isArray(typeArray) && typeArray.length > 0) {
          const match = typeArray.find(item => {
            if (!item || typeof item !== 'object') return false;
            if (repStr === null) return true;
            const itemRep = (item.repeatable ?? item.rep ?? item.cycle ?? '0').toString();
            return itemRep === repStr;
          });
          if (match && match.value !== undefined && match.value !== null && match.value !== '') {
            return safeGetValue(match.value);
          }
          if (repStr === null || repStr === '0') {
            const first = typeArray[0];
            if (first && first.value !== undefined && first.value !== null && first.value !== '') {
              return safeGetValue(first.value);
            }
          }
        }
      }
    }

    const containers = [
      point.observations,
      point.summary,
      point.saved_values,
      point.savedValues,
      point.values,
      point.data
    ];

    for (const list of containers) {
      if (Array.isArray(list) && list.length > 0) {
        const match = list.find(item => {
          if (!item || typeof item !== 'object') return false;
          const itemType = (item.type || item.obs_type || item.key || '').toString().toLowerCase();
          if (itemType !== typeLower) return false;
          if (repStr === null) return true;
          const itemRep = (item.repeatable ?? item.rep ?? item.cycle ?? '0').toString();
          return itemRep === repStr;
        });
        if (match) {
          const val = match.value ?? match.val ?? match.reading ?? match.observed;
          if (val !== undefined && val !== null && val !== '') return safeGetValue(val);
        }
      } else if (list && typeof list === 'object') {
        const typeArr = list[typeLower] ?? list[type];
        if (Array.isArray(typeArr) && typeArr.length > 0) {
          const match = typeArr.find(item => {
            if (!item || typeof item !== 'object') return false;
            if (repStr === null) return true;
            const itemRep = (item.repeatable ?? item.rep ?? item.cycle ?? '0').toString();
            return itemRep === repStr;
          });
          if (match && match.value !== undefined && match.value !== null && match.value !== '') {
            return safeGetValue(match.value);
          }
        }
      }
    }

    if (type === 'master') {
      const m = point.master ?? point.master_values ?? point.master_readings ?? point.observed_master;
      if (Array.isArray(m) && m.length > 0) {
        const idx = repeatable !== null ? parseInt(repeatable, 10) : 0;
        return safeGetValue(m[idx]);
      }
      if (m && typeof m === 'object') {
        const idx = repeatable !== null ? repeatable.toString() : '0';
        return safeGetValue(m[idx] ?? m[`m${parseInt(idx, 10) + 1}`] ?? m.value);
      }
      if (m !== undefined && m !== null && m !== '' && (repeatable === null || repeatable === 0 || repeatable === '0')) {
        return safeGetValue(m);
      }
    }

    if (type === 'uuc') {
      const u = point.uuc ?? point.uuc_values ?? point.uuc_readings ?? point.observed_uuc;
      if (Array.isArray(u) && u.length > 0) {
        const idx = repeatable !== null ? parseInt(repeatable, 10) : 0;
        return safeGetValue(u[idx]);
      }
      if (u && typeof u === 'object') {
        const idx = repeatable !== null ? repeatable.toString() : '0';
        return safeGetValue(u[idx] ?? u[`u${parseInt(idx, 10) + 1}`] ?? u.value);
      }
      if (u !== undefined && u !== null && u !== '' && (repeatable === null || repeatable === 0 || repeatable === '0')) {
        return safeGetValue(u);
      }
    }

    if (type === 'parameter') return safeGetValue(point.parameter ?? point.param ?? point.description);
    if (type === 'specification') return safeGetValue(point.specification ?? point.spec);
    if (type === 'setpoint') return safeGetValue(point.point ?? point.setpoint ?? point.set_point ?? point.nominal_value);
    if (type === 'averagemaster') return safeGetValue(point.averagemaster ?? point.average_master ?? point.mean);
    if (type === 'averageuuc') return safeGetValue(point.averageuuc ?? point.average_uuc);
    if (type === 'error') return safeGetValue(point.error ?? point.err);
    if (type === 'remark') return safeGetValue(point.remark ?? point.remarks);

    return '';
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


  const getObservationFieldLabel = (key, tableData) => {
    if (!key || !tableData) return '';
    const [rStr, cStr] = key.split('-');
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);

    if (tableData.id === 'observationwb') {
      const weighingCount = tableData.weighingCount || 0;
      const repeatabilityCount = tableData.repeatabilityCount || 0;

      if (r < weighingCount) {
        const nominal = tableData.staticRows?.[r]?.[1] || '';
        return `Weighing Process: Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Reading ${c - 1}`;
      } else if (r < weighingCount + repeatabilityCount) {
        const repRow = r - weighingCount + 1;
        const nominal = tableData.staticRows?.[r]?.[0] || '';
        return `Repeatability: Row ${repRow}${nominal ? ` (${nominal})` : ''}, Reading ${c}`;
      } else {
        const eccRow = r - weighingCount - repeatabilityCount + 1;
        const nominal = tableData.staticRows?.[r]?.[0] || '';
        const readingName = c <= 5 ? `Clockwise ${c}` : `Anticlockwise ${c - 5}`;
        return `Eccentricity: Row ${eccRow}${nominal ? ` (${nominal})` : ''}, ${readingName}`;
      }
    }

    if (tableData.id === 'observationwbn') {
      const nominal = tableData.staticRows?.[r]?.[1] || '';
      if (c >= 2 && c <= 4) {
        return `Weighing Process: Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Reading ${c - 1}`;
      } else if (c >= 7 && c <= 11) {
        return `Repeatability: Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Reading ${c - 6}`;
      } else if (c >= 13 && c <= 17) {
        return `Eccentricity: Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Clockwise ${c - 12}`;
      } else if (c >= 18 && c <= 22) {
        return `Eccentricity: Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Anticlockwise ${c - 17}`;
      }
      return `Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Column ${c + 1}`;
    }

    if (tableData?.id === 'observationbiomedical') {
      const parts = String(key).split('-');
      const pointId = parts[0];
      const type = parts[1] || '';
      const index = parts[2] !== undefined ? parseInt(parts[2], 10) + 1 : '';
      const bioPoints = (tableData?.calibration_points && tableData.calibration_points.length > 0)
        ? tableData.calibration_points
        : (observations || []);
      const point = bioPoints.find(p => String(p.calibration_point_id || p.id) === String(pointId));
      const paramName = point?.parameter || point?.unittype || `Point ${pointId}`;
      const typeLabel = type === 'master' ? `Master Reading ${index}` : (type === 'uuc' ? `UUC Reading ${index}` : type);
      return `${paramName} (${typeLabel})`;
    }

    if (tableData?.id === 'observationcustom') {
      const layout = getCustomLayoutIndices(instrument);
      if (layout) {
        let colName = `Column ${c + 1}`;
        if (c === layout.paramIdx) colName = instrument?.parameterheading || 'Parameter';
        else if (c === layout.specIdx) colName = instrument?.specificationheading || 'Specification';
        else if (c === layout.setpointIdx) {
          colName = instrument?.setpoint === 'Master' ? (instrument?.masterheading || 'Master') : (instrument?.setpoint === 'UUC' ? (instrument?.uucheading || 'UUC') : (instrument?.setpointheading || 'Set Point'));
        }
        else if (layout.masterObsIndices.includes(c)) {
          const idx = layout.masterObsIndices.indexOf(c) + 1;
          colName = `${instrument?.masterheading || 'Master'} Obs ${idx}`;
        }
        else if (layout.uucObsIndices.includes(c)) {
          const idx = layout.uucObsIndices.indexOf(c) + 1;
          colName = `${instrument?.uucheading || 'UUC'} Obs ${idx}`;
        }
        else if (c === layout.avgMasterIdx) colName = 'Avg Master';
        else if (c === layout.avgUucIdx) colName = 'Avg UUC';
        else if (c === layout.errorIdx) colName = instrument?.errorheading || 'Error';
        else if (c === layout.remarkIdx) colName = instrument?.remarkheading || 'Remark';

        const nominal = tableData.staticRows?.[r]?.[layout.setpointIdx !== -1 ? layout.setpointIdx : 1] || '';
        return `Row ${r + 1}${nominal ? ` (${nominal})` : ''}: ${colName}`;
      }
    }

    const nominal = tableData.staticRows?.[r]?.[1] || tableData.staticRows?.[r]?.[0] || '';
    return `Row ${r + 1}${nominal ? ` (${nominal})` : ''}, Column ${c + 1}`;
  };

  const validateObservationFields = () => {
    let newErrors = {};

    if (!selectedTableData || (!selectedTableData.staticRows && selectedTableData.id !== 'observationbiomedical')) {
      return { isValid: true, errors: {}, firstErrorKey: null, errorCount: 0 };
    }

    if (selectedTableData.id === 'observationbiomedical') {
      const bioPoints = (selectedTableData?.calibration_points && selectedTableData.calibration_points.length > 0)
        ? selectedTableData.calibration_points
        : (observations || []);

      const activeBioPoints = bioPoints.filter(p => {
        const isSafety = p.is_electrical_safety || p.biomedical_section === 'Electrical Safety';
        if (isSafety) return isElectricalSafetyVisible;
        return isPerformanceVisible;
      });
      const pointsToProcess = activeBioPoints;

      pointsToProcess.forEach((point) => {
        const pointId = point.calibration_point_id || point.id;
        if (!pointId) return;

        const isSource = point.mode === 'Source';
        const isMasterReadOnly = point.mode === 'Measure';
        const isUucReadOnly = point.mode === 'Source';
        const isWaveform = (point.parameter || point.unittype || '').toLowerCase().includes('waveform');

        const masterCount = Array.isArray(point.master_readings) && point.master_readings.length > 0
          ? point.master_readings.length
          : (isSource ? 5 : 1);
        const uucCount = Array.isArray(point.uuc_readings) && point.uuc_readings.length > 0
          ? point.uuc_readings.length
          : (isSource ? 1 : 5);

        let leastCount = point.least_count;
        let masterLeastCount = point.master_least_count;
        if (masterLeastCount && masterLeastCount !== 'NA') {
          const numLc = parseFloat(leastCount);
          if (!leastCount || leastCount === 'NA' || isNaN(numLc)) {
            leastCount = masterLeastCount;
          }
        }
        leastCount = leastCount || '0.01';
        masterLeastCount = masterLeastCount || '0.01';

        // Check editable master readings
        if (!isMasterReadOnly) {
          for (let i = 0; i < masterCount; i++) {
            const key = `${pointId}-master-${i}`;
            const value = tableInputValues[key] ?? (point.master_readings?.[i]?.value ?? '');
            const strVal = String(value).trim();
            if (!strVal) {
              newErrors[key] = 'This field is required';
            } else if (!isWaveform) {
              const { isValid, error } = validateLeastCount(strVal, masterLeastCount);
              if (!isValid) {
                newErrors[key] = error;
              }
            }
          }
        }

        // Check editable uuc readings
        if (!isUucReadOnly) {
          for (let i = 0; i < uucCount; i++) {
            const key = `${pointId}-uuc-${i}`;
            const value = tableInputValues[key] ?? (point.uuc_readings?.[i]?.value ?? '');
            const strVal = String(value).trim();
            if (!strVal) {
              newErrors[key] = 'This field is required';
            } else if (!isWaveform) {
              const { isValid, error } = validateLeastCount(strVal, leastCount);
              if (!isValid) {
                newErrors[key] = error;
              }
            }
          }
        }
      });

      setObservationErrors(newErrors);
      const errorKeys = Object.keys(newErrors);
      return {
        isValid: errorKeys.length === 0,
        errors: newErrors,
        firstErrorKey: errorKeys[0] || null,
        errorCount: errorKeys.length,
      };
    }

    if (selectedTableData?.structure?.thermalCoeff) {
      if (!thermalCoeff.uuc || String(thermalCoeff.uuc).trim() === '') {
        toast.error('UUC Thermal Coefficient is required.');
        return { isValid: false, errors: { uucThermalCoeff: 'Required' }, firstErrorKey: null, errorCount: 1 };
      }
      if (!thermalCoeff.master || String(thermalCoeff.master).trim() === '') {
        toast.error('Master Thermal Coefficient is required.');
        return { isValid: false, errors: { masterThermalCoeff: 'Required' }, firstErrorKey: null, errorCount: 1 };
      }
    }

    if ((selectedTableData?.id === 'observationwb' || selectedTableData?.id === 'observationwbn') && !diagram) {
      toast.error('Please select a Diagram Choice.');
      return { isValid: false, errors: {}, firstErrorKey: null, errorCount: 0, reason: 'diagram' };
    }

    // Determine the highest nominal value row for specific templates
    let maxNominalRowIndex = -1;
    if (['observationmt', 'observationctg', 'observationfg', 'observationmsr', 'observationexm', 'observationvc', 'observationhg'].includes(selectedTableData.id)) {
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

    const validationRows = selectedTableData.staticRows || [];
    validationRows.forEach((row, rowIndex) => {
      const isLastRow = (rowIndex === validationRows.length - 1) || (maxNominalRowIndex !== -1 && rowIndex === maxNominalRowIndex);

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
          const isOptional = (col === 8 || col === 9) && !isLastRow;

          if (!value.trim()) {
            if (!isOptional) {
              newErrors[key] = 'This field is required';
            }
          } else {
            // Scaled-integer least-count check; float % flagged valid values like 3 with LC 0.001
            const { isValid, error } = validateLeastCount(value.trim(), leastCount);
            if (!isValid) newErrors[key] = error;
          }
        }
      } else if (selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationvc') {
        // Nominal value (column 1) is required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6)
        // If more than 3 observation columns, only the last row has validation for obs 4 & 5
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          const isOptional = (col === 5 || col === 6) && !isLastRow;

          if (!value.trim() && !isOptional) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationwbn') {
        const point = observations?.[rowIndex];
        const mode = point?.mode?.toLowerCase() || '';
        const weighingCount = selectedTableData?.weighingCount ?? 0;
        const repeatabilityCount = selectedTableData?.repeatabilityCount ?? 0;
        const isWeighing = mode.includes('weighing') || (weighingCount > 0 && rowIndex < weighingCount) || (!mode && rowIndex < weighingCount);
        const isRepeatability = mode.includes('repeatability') || (repeatabilityCount > 0 && rowIndex >= weighingCount && rowIndex < weighingCount + repeatabilityCount);
        const isEccentricity = mode.includes('eccentricity') || (rowIndex >= weighingCount + repeatabilityCount);

        const validateWbnCell = (key, val) => {
          if (!val || String(val).trim() === '') {
            newErrors[key] = 'This field is required';
            return;
          }
          const num = parseFloat(val);
          if (isNaN(num)) {
            newErrors[key] = 'Please enter a valid number';
          }
        };

        if (isWeighing) {
          // Weighing Process: Nominal is col 1; readings 1, 2, 3 are cols 2, 3, 4
          for (let col = 2; col <= 4; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            validateWbnCell(key, value);
          }
        } else if (isRepeatability) {
          // Repeatability: readings 1 to 5 are cols 1 to 5
          for (let col = 1; col <= 5; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            validateWbnCell(key, value);
          }
        } else if (isEccentricity) {
          // Eccentricity: Clockwise 1..5 (cols 1..5) & Anticlockwise 1..5 (cols 6..10)
          for (let col = 1; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            validateWbnCell(key, value);
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
        // Nominal value (column 1) is required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6)
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          const isOptional = (col === 5 || col === 6) && !isLastRow;

          if (!value.trim() && !isOptional) {
            newErrors[key] = 'This field is required';
          }
        }
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
        // Nominal value (column 1) is required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6)
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          const isOptional = (col === 5 || col === 6) && !isLastRow;

          if (!value.trim() && !isOptional) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationhg') {
        // Nominal value (column 1) is required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6)
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          const isOptional = (col === 5 || col === 6) && !isLastRow;

          if (!value.trim() && !isOptional) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationit') {
        // Nominal value (column 1) is required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6)
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          const isOptional = (col === 5 || col === 6) && !isLastRow;

          if (!value.trim() && !isOptional) {
            newErrors[key] = 'This field is required';
          }
        }
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
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];
        const point = observations?.[rowIndex];
        const uucLc = (typeof lcInfo === 'object' ? (lcInfo?.uucStr ?? lcInfo?.uuc) : null) ?? point?.metadata?.least_count ?? point?.least_count ?? 1;
        const masterLc = (typeof lcInfo === 'object' ? (lcInfo?.masterStr ?? lcInfo?.master) : null) ?? point?.metadata?.master_least_count ?? point?.master_least_count ?? 0.005;

        // Nominal UUC value
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        } else {
          const { isValid, error } = validateLeastCount(nominalValue, uucLc);
          if (!isValid) {
            newErrors[nominalKey] = error;
          }
        }

        const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex] || point?.metadata?.repeatable_cycle, 10) || 5;
        for (let col = 2; col < 2 + repeatableCycle; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');

          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else {
            const { isValid, error } = validateLeastCount(value, masterLc);
            if (!isValid) {
              newErrors[key] = error;
            }
          }
        }
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
          const isOptional = (col === 5 || col === 6) && !isLastRow;

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
      } else if (selectedTableData.id === 'observationdpg') {
        // M1, M2, M3 (columns 3, 4, 5) are required editable master observations
        for (let col = 3; col <= 5; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationapg') {
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
          const isOptional = (col === 6 || col === 7) && !isLastRow;
          if (!value.trim() && !isOptional) {
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
            const isOptional = (col === 9 || col === 10) && !isLastRow;
            if (!value.trim() && !isOptional) {
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
            const isOptional = (col === 9 || col === 10) && !isLastRow;
            if (!value.trim() && !isOptional) {
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
      } else if (selectedTableData.id === 'observationtswoi') {
        // PHP: required,number on every editable numeric input; no least-count check
        const rowData = row.map((cell, idx) => tableInputValues[`${rowIndex}-${idx}`] ?? (cell?.toString() || ''));
        Object.assign(newErrors, validateTSWOIRow(rowData, rowIndex));
      } else if (selectedTableData.id === 'observationtswi') {
        // PHP: required,number on editable inputs; UUC readings also inleastcount/divisibleby
        const rowData = row.map((cell, idx) => tableInputValues[`${rowIndex}-${idx}`] ?? (cell?.toString() || ''));
        Object.assign(newErrors, validateTSWIRow(rowData, rowIndex, selectedTableData.rowMeta?.[rowIndex], validateLeastCount));
      } else if (selectedTableData.id === 'observationsw') {
        // PHP: every editable input required; UUC/master readings also inleastcount/divisibleby
        const rowData = row.map((cell, idx) => tableInputValues[`${rowIndex}-${idx}`] ?? (cell?.toString() || ''));
        Object.assign(newErrors, validateSWRow(rowData, rowIndex, selectedTableData.rowMeta?.[rowIndex], validateLeastCount));
      } else if (selectedTableData.id === 'observationsutm') {
        // PHP: displacement and time are required,number; no least-count check
        const rowData = row.map((cell, idx) => tableInputValues[`${rowIndex}-${idx}`] ?? (cell?.toString() || ''));
        Object.assign(newErrors, validateSUTMRow(rowData, rowIndex));
      } else if (selectedTableData.id === 'observationuc') {
        // Range (col 2), Calculated Value (col 3), Set Value (col 4) are required
        for (let col = 2; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }

        // Observations 1-5 (col 5-9) are required and must respect the least count
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const obsLc = getUCObservationLc(leastCountData[calibPointId] || leastCountData[String(calibPointId)]);
        for (let col = 5; col <= 9; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else if (isNaN(Number(value))) {
            newErrors[key] = 'Please enter a valid number';
          } else if (obsLc) {
            const { isValid, error } = validateLeastCount(value.trim(), obsLc);
            if (!isValid) newErrors[key] = error;
          }
        }
      }
      else if (selectedTableData.id === 'observationth') {
        const rowType = row[1]; // UUC or Master
        // The point id lives in hiddenInputs for TH; reading only
        // selectedTableData.calibrationPoints left lcs undefined, so both branches
        // silently validated against the 0.001 fallback instead of the real least
        // count. Same lookup the TH blur handler uses.
        const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex]
          ?? selectedTableData?.calibrationPoints?.[rowIndex];
        const lcs = leastCountData[calibPointId] || leastCountData[String(calibPointId)];
        const leastCount = parseFloat(rowType === 'UUC' ? (lcs?.uuc ?? 0.001) : (lcs?.master ?? 0.001));

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
          const isOptional = (col === 8 || col === 9) && !isLastRow;
          if (!value.trim()) {
            if (!isOptional) {
              newErrors[key] = 'This field is required';
            }
          } else if (leastCount) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue !== 0) {
              if (numValue < leastCount) {
                newErrors[key] = `Please enter a value within least count ${leastCount}`;
              } else {
                // Float modulo is unreliable here: 15.2 % 0.001 is 0.000999...,
                // not 0, so every value looked indivisible. Compare as scaled
                // integers, same as the blur-time check does.
                const factor = 1000000;
                const scaledVal = Math.round(numValue * factor);
                const scaledLc = Math.round(leastCount * factor);
                if (scaledLc > 0 && scaledVal % scaledLc !== 0) {
                  newErrors[key] = `Please enter a value divisible by ${leastCount}`;
                }
              }
            }
          }
        }
      }
      else if (selectedTableData.id === 'observationwb') {
        const weighingCount = selectedTableData.weighingCount || 0;
        const repeatabilityCount = selectedTableData.repeatabilityCount || 0;
        const point = observations?.[rowIndex];
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];
        const rawLc = point?.least_count_uuc || point?.least_count || (typeof lcInfo === 'object' ? lcInfo?.uuc : lcInfo) || instrument?.leastcount;
        const leastCount = (rawLc && rawLc !== 'NA' && !isNaN(parseFloat(rawLc)) && parseFloat(rawLc) > 0)
          ? parseFloat(rawLc)
          : undefined;

        const validateCell = (key, value) => {
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              newErrors[key] = 'Please enter a valid number';
            } else if (leastCount) {
              const lcStr = String(leastCount).trim();
              const decPlaces = lcStr.includes('.') ? lcStr.split('.')[1].length : 0;
              const valDecPlaces = value.includes('.') ? value.split('.')[1].length : 0;

              if (decPlaces > 0 && valDecPlaces > decPlaces) {
                newErrors[key] = `Maximum ${decPlaces} decimal place(s) allowed for least count ${leastCount}`;
              } else if (numValue !== 0) {
                const factor = 1000000;
                const remainder = Math.round(numValue * factor) % Math.round(leastCount * factor);
                if (remainder !== 0) {
                  newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
                }
              }
            }
          }
        };

        if (rowIndex < weighingCount) {
          for (let col = 2; col <= 4; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            validateCell(key, value);
          }
        } else if (rowIndex < weighingCount + repeatabilityCount) {
          for (let col = 1; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            validateCell(key, value);
          }
        } else {
          for (let col = 1; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            validateCell(key, value);
          }
        }
      }
      else if (selectedTableData.id === 'observationcustom') {
        const layout = getCustomLayoutIndices(instrument);
        if (layout) {
          const requiredCols = [];
          if (layout.paramIdx !== -1) requiredCols.push(layout.paramIdx);
          if (layout.specIdx !== -1) requiredCols.push(layout.specIdx);
          if (layout.setpointIdx !== -1) requiredCols.push(layout.setpointIdx);
          layout.masterObsIndices.forEach(idx => requiredCols.push(idx));
          layout.uucObsIndices.forEach(idx => requiredCols.push(idx));
          if (layout.remarkIdx !== -1) requiredCols.push(layout.remarkIdx);

          const obsCols = [...layout.masterObsIndices, ...layout.uucObsIndices];
          const rawLc = instrument?.leastcount;
          const leastCount = (rawLc && rawLc !== 'NA' && !isNaN(parseFloat(rawLc)) && parseFloat(rawLc) > 0)
            ? parseFloat(rawLc)
            : undefined;

          requiredCols.forEach(col => {
            const key = `${rowIndex}-${col}`;
            const rawVal = tableInputValues[key] ?? row[col];
            const value = (rawVal !== undefined && rawVal !== null) ? rawVal.toString() : '';
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            } else if (leastCount && obsCols.includes(col)) {
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && numValue !== 0) {
                if (numValue < leastCount) {
                  newErrors[key] = `Please enter a value with in leastcount ${leastCount}`;
                } else {
                  const factor = 1000000;
                  const remainder = Math.round(numValue * factor) % Math.round(leastCount * factor);
                  if (remainder !== 0) {
                    newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
                  }
                }
              }
            }
          });
        }
      }
    });

    setObservationErrors(newErrors);
    const errorKeys = Object.keys(newErrors);
    return {
      isValid: errorKeys.length === 0,
      errors: newErrors,
      firstErrorKey: errorKeys[0] || null,
      errorCount: errorKeys.length,
    };
  };

  // Shared transform: converts DW API response (cycles array) → flat arrays expected by createObservationRows
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

        // Handle observationupload separately — it returns ulrno/issuedate/accreditation
        if (observationTemplate === 'observationupload') {
          if (isSuccess && response.data.data) {
            setUploadData(response.data.data);
          }
          return;
        }

        if (isSuccess && (response.data.data || response.data.calibration_points || observationTemplate === 'observationbiomedical')) {
          const observationData = observationTemplate === 'observationbiomedical' ? response.data : (response.data.data || response.data);

          if (observationTemplate === 'observationmt' && observationData.thermal_coeff) {
            setThermalCoeff({
              uuc: observationData.thermal_coeff.uuc || '',
              master: observationData.thermal_coeff.master || '',
              thickness_of_graduation: observationData.thermal_coeff.thickness_of_graduation || '',
            });
          }

          if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
            setObservations(observationData.calibration_points);
          } else if (observationTemplate === 'observationdpg' && observationData.observations) {
            // console.log('✅ Setting DPG Observations:', observationData.observations);
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationapg') {
            setObservations(observationData);
          } else if (observationTemplate === 'observationmm') {

            // ✅ NEW: Initialize least count map
            const leastCountMap = {};

            // Try different possible data structures for MM
            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
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

              // Try to extract calibration points from the object structure
              const possiblePoints = Object.values(observationData).filter(
                item => item && typeof item === 'object' && (item.sr_no !== undefined || item.sequence_number !== undefined)
              );

              if (possiblePoints.length > 0) {
                setObservations(possiblePoints);

                // Extract least count from found points
                possiblePoints.forEach(point => {
                  if (point.point_id && point.precision?.uuc_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                  }
                });
              } else {
                setObservations([]);
              }
            }

            // ✅ Store least count data for validation
            setLeastCountData(leastCountMap);
          }
          else if (observationTemplate === 'observationavg') {

            const avgData = observationData.data || observationData;

            if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
              setObservations(avgData.calibration_point);
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationes') {
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
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationmg') {

            // Handle nested data structure for MG
            const mgData = observationData.data || observationData;

            if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
              setObservations(mgData.calibration_points);
            } else if (mgData.observations && Array.isArray(mgData.observations)) {
              setObservations(mgData.observations);
            } else {
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationrtdwi') {

            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              setObservations(observationData.calibration_points);
            } else {
              setObservations([]);
            }
          }
          else if (observationTemplate === 'observationtswoi') {
            setObservations(extractTSWOIPoints(observationData) || []);
          }
          else if (observationTemplate === 'observationtswi') {
            setObservations(extractTSWIPoints(observationData) || []);
          }
          else if (observationTemplate === 'observationsw') {
            setObservations(extractSWPoints(observationData) || []);
          }
          else if (observationTemplate === 'observationsutm') {
            setObservations(extractSUTMPoints(observationData) || []);
          }
          else if (observationTemplate === 'observationfg') {

            // Handle nested data structure for FG
            const fgData = observationData.data || observationData;

            // Check if calibration_points exists directly
            if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
              setObservations(fgData.calibration_points);

              // Handle thermal coefficients for FG
              if (fgData.thermal_coefficients) {
                setThermalCoeff({
                  uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
                  master: fgData.thermal_coefficients.thermal_coeff_master || '',
                  thickness_of_graduation: '' // FG doesn't use this field
                });
              }
            }
            // Check if unit_types exists (for backward compatibility)
            else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
              setObservations(fgData.unit_types);

              // Handle thermal coefficients for FG
              if (fgData.thermal_coeff) {
                setThermalCoeff({
                  uuc: fgData.thermal_coeff.uuc || '',
                  master: fgData.thermal_coeff.master || '',
                  thickness_of_graduation: '' // FG doesn't use this field
                });
              }
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationexm') {

            // EXM structure is similar to HG but thermal coefficients are directly uuc/master
            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              setObservations(observationData.calibration_points);
              seedTableInputsFromPoints(observationData.calibration_points);

              // Handle thermal coefficients and additional measurements
              const addl = response.data.additional_measurements || observationData?.additional_measurements || {};
              setThermalCoeff({
                uuc: observationData.thermal_coefficients?.uuc || '',
                master: observationData.thermal_coefficients?.master || '',
                thickness_of_graduation: '', // EXM doesn't use this field
                parallinternal: addl.parallelism_spindle_anvil?.value ?? addl.parallinternal?.value ?? ''
              });
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationvc') {
            let vcPoints = response.data.calibration_points || observationData?.calibration_points;
            if (!vcPoints && observationData?.matrix_groups && Array.isArray(observationData.matrix_groups)) {
              vcPoints = observationData.matrix_groups.flatMap(g => g.points || []);
            }
            if (!vcPoints && Array.isArray(observationData)) {
              vcPoints = observationData;
            }
            if (!vcPoints) vcPoints = [];

            if (Array.isArray(vcPoints) && vcPoints.length > 0) {
              setObservations(vcPoints);
              seedTableInputsFromPoints(vcPoints);
            } else {
              setObservations([]);
            }

            const thermal = response.data.thermal_coefficients || observationData?.thermal_coefficients;
            if (thermal) {
              setThermalCoeff({
                uuc: thermal.uuc || '',
                master: thermal.master || '',
                thickness_of_graduation: ''
              });
            }

            const addl = response.data.additional_measurements || observationData?.additional_measurements || {};
            setParallelism({
              parallinternal: addl.parallelism_spindle_anvil?.value ?? addl.parallelism_internal?.value ?? addl.parallinternal ?? addl.internal ?? response.data.parallinternal ?? '',
              parallexternal: addl.parallelism_external?.value ?? addl.parallexternal ?? addl.external ?? response.data.parallexternal ?? '',
            });
          } else if (observationTemplate === 'observationgtm') {

            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              setObservations(observationData.calibration_points);
            } else {
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationpr') {
            const prData = observationData?.data || observationData;
            const matrices = prData?.matrices || observationData?.matrices || response.data?.matrices || [];
            if (Array.isArray(matrices) && matrices.length > 0) {
              setObservations(matrices);
            } else if (Array.isArray(prData?.points)) {
              setObservations([{ matrix_id: 'default', points: prData.points }]);
            } else {
              setObservations(Array.isArray(prData) ? prData : []);
            }
          }

          else if (observationTemplate === 'observationit') {
            // Handle nested data structure
            const itData = observationData.data || observationData;

            if (itData.calibration_points) {
              setObservations(itData.calibration_points);

              // FIX: Handle thermal coefficients for IT with correct keys
              if (itData.thermal_coefficients) {
                setThermalCoeff(prev => ({
                  uuc: itData.thermal_coefficients.uuc_coefficient || '',
                  master: itData.thermal_coefficients.master_coefficient || '',
                  thickness_of_graduation: prev.thickness_of_graduation || '', // preserve existing
                }));
              }
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationhg') {

            // HG has calibration_points in the second object of the array
            const hgData = observationData[1] || observationData;

            if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
              setObservations(hgData.calibration_points);

              // Handle thermal coefficients from the first object
              if (observationData[0] && observationData[0].thermal_coefficients) {
                setThermalCoeff({
                  uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
                  master: observationData[0].thermal_coefficients.master_coefficient || '',
                  thickness_of_graduation: '' // HG doesn't use this field
                });
              }
            } else {
              setObservations([]);
            }
          } else if (observationTemplate === 'observationmsr') {

            // Handle array structure - MSR returns array with unit types
            if (Array.isArray(observationData) && observationData.length > 0) {
              const msrData = observationData[0]; // Get first unit type object

              if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
                setObservations(msrData.calibration_points);

                // Handle thermal coefficients
                if (msrData.thermal_coeff) {
                  setThermalCoeff({
                    uuc: msrData.thermal_coeff.uuc || '',
                    master: msrData.thermal_coeff.master || '',
                    thickness_of_graduation: '' // MSR doesn't use this field
                  });
                }
              } else {
                setObservations([]);
              }
            } else {
              setObservations([]);
            }
          }
          else if (observationTemplate === 'observationmt') {

            // Handle nested data structure for MT
            const mtData = observationData.data || observationData;

            if (mtData.calibration_points) {
              setObservations(mtData.calibration_points);

              const leastCountMap = {};
              mtData.calibration_points.forEach((point) => {
                const calibPointId = point.point_id?.toString() || point.calibration_point_id?.toString() || point.id?.toString();
                if (calibPointId) {
                  const uucLc = point.metadata?.least_count ?? point.least_count ?? point.leastcount ?? 1;
                  const masterLc = point.metadata?.master_least_count ?? point.master_least_count ?? point.masterleastcount ?? 0.005;
                  leastCountMap[calibPointId] = {
                    uuc: parseFloat(uucLc),
                    master: parseFloat(masterLc),
                    uucStr: String(uucLc),
                    masterStr: String(masterLc),
                    decimals: point.metadata?.decimal_places,
                    master_decimals: point.metadata?.master_decimal_places,
                    repeatable_cycle: point.metadata?.repeatable_cycle,
                  };
                }
              });
              setLeastCountData(prev => ({ ...prev, ...leastCountMap }));

              // Handle thermal coefficients for MT
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

          else if (observationTemplate === 'observationdg') {

            // DG can return data in multiple formats - handle all cases
            if (observationData.observations && Array.isArray(observationData.observations)) {
              setObservations(observationData.observations);
            } else if (Array.isArray(observationData)) {
              // Fallback if data is directly an array
              setObservations(observationData);
            } else {
              setObservations([]);
            }

            // Handle thermal coefficients for DG
            if (observationData.thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData.thermal_coefficients.uuc || '',
                master: observationData.thermal_coefficients.master || '',
                thickness_of_graduation: '' // DG doesn't use this field
              });
            }
          }

          else if (observationTemplate === 'observationdw') {

            const env = response.data?.environment || observationData.environment;
            const dwData = Array.isArray(observationData) ? observationData : observationData.data || observationData.calibration_points;


            if (env) {
              const envPressureStart = env.pressure_start || env.pressurestart || '';
              const envPressureEnd = env.pressure_end || env.pressureend || '';
              const envStabilizationTime = env.stabilization_time || env.stabilizationtime || '';


              setFormData(prev => ({
                ...prev,
                pressurestart: envPressureStart || '',
                pressureend: envPressureEnd || '',
                stabilizationtime: envStabilizationTime || '',
              }));

              const envTableValues = {
                [`${instId}-pressure-start`]: envPressureStart,
                [`${instId}-pressure-end`]: envPressureEnd,
                [`${instId}-stabilization`]: envStabilizationTime,
              };

              setTableInputValues(prev => ({
                ...prev,
                ...envTableValues,
              }));

            }

            if (Array.isArray(dwData) && dwData.length > 0) {
              setObservations(dwData);
            } else {
              setObservations([]);
            }
          }


          else if (observationTemplate === 'observationutm' || observationTemplate === 'observationautm') {

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

            const utmObservations = utmData.filter(Boolean);
            // pre_loading_cycles sits next to matrices in the response; carry it along
            // so the AUTM component can show the saved checkbox state.
            if (Array.isArray(observationData.pre_loading_cycles)) {
              utmObservations.preLoadingCycles = observationData.pre_loading_cycles;
            }
            setObservations(utmObservations);

            // Initialize tableInputValues with saved UTM observations
            if (utmData && Array.isArray(utmData)) {
              setTableInputValues(prev => {
                const updated = { ...prev };

                utmData.forEach((matrix) => {
                  const calibrationPoints = matrix.calibration_points || matrix.rows || [];

                  calibrationPoints.forEach((point, pointIndex) => {
                    const realId = selectedTableData?.calibration_points?.[pointIndex]?.id ||
                      selectedTableData?.calibration_points?.[pointIndex]?.point_id ||
                      selectedTableData?.calibration_points?.[pointIndex]?.calibration_point_id;
                    const pointId = point.id || point.point_id || point.calibration_point_id || point.calibrationpoint || realId || `pt-${pointIndex}`;

                    // Load setpoint (force value)
                    if (point.force) {
                      updated[`${pointId}-setpoint`] = String(point.force);
                    }

                    // Load calculated UUC (at standard temperature)
                    if (point.calculated_uuc) {
                      updated[`${pointId}-calculateduuc`] = String(point.calculated_uuc);
                    }

                    // Load UUC at room temperature (with temperature compensation)
                    if (point.uuc) {
                      updated[`${pointId}-uuc`] = String(point.uuc);
                    }

                    // Load master readings (m0, m1, m2)
                    if (point.master_readings && Array.isArray(point.master_readings)) {
                      point.master_readings.forEach((reading, idx) => {
                        if (reading !== null && reading !== undefined && reading !== '') {
                          updated[`${pointId}-m${idx}`] = String(reading);
                        }
                      });
                    }

                    // Load calculated values
                    if (point.average_master) {
                      updated[`${pointId}-average`] = String(point.average_master);
                    }
                    if (point.error) {
                      updated[`${pointId}-error`] = String(point.error);
                    }
                    if (point.percent_error) {
                      updated[`${pointId}-percentError`] = String(point.percent_error);
                    }
                    if (point.repeatability) {
                      updated[`${pointId}-repeatability`] = String(point.repeatability);
                    }
                  });

                  // Load removal force data
                  if (matrix.zero_error_data && matrix.zero_error_data.removal_forces) {
                    matrix.zero_error_data.removal_forces.forEach((force, idx) => {
                      if (force !== null && force !== undefined && force !== '') {
                        updated[`removalforce-${idx}`] = String(force);
                      }
                    });
                  }

                  // Load zero error data
                  if (matrix.zero_error_data && matrix.zero_error_data.zero_errors) {
                    matrix.zero_error_data.zero_errors.forEach((error, idx) => {
                      if (error !== null && error !== undefined && error !== '') {
                        updated[`zeroerror-${idx}`] = String(error);
                      }
                    });
                  }

                  // Load additional data
                  if (matrix.additional_data) {
                    if (matrix.additional_data.class_of_machine) {
                      updated['classofmachine'] = String(matrix.additional_data.class_of_machine);
                    }
                    if (matrix.additional_data.dial_gauge_setting) {
                      updated['dialguagesetting'] = String(matrix.additional_data.dial_gauge_setting);
                    }
                    if (matrix.additional_data.max_relative_resolution !== undefined && matrix.additional_data.max_relative_resolution !== null) {
                      updated['releativeres'] = String(matrix.additional_data.max_relative_resolution);
                    }
                  }

                  // Load flat observations from matrix (often returned this way for AUTM)
                  if (matrix.observations && Array.isArray(matrix.observations)) {
                    matrix.observations.forEach((obs) => {
                      const ptId = obs.calibrationpoint || obs.calibration_point_id || obs.point_id;
                      if (obs.type === 'master') {
                        updated[`${ptId}-m${obs.repeatable}`] = String(obs.value);
                      } else if (obs.type === 'removalforce') {
                        updated[`${ptId}-removalforce-${obs.repeatable}`] = String(obs.value);
                      } else if (obs.type === 'classofmachine') {
                        updated[`${ptId}-classofmachine`] = String(obs.value);
                      } else if (obs.type === 'dialguageseting' || obs.type === 'dialgaugesetting') {
                        updated[`${ptId}-dialguageseting`] = String(obs.value);
                      }
                    });
                  }
                });

                return updated;
              });
            }
          }

          else if (observationTemplate === 'observationctg' && observationData.points) {
            setObservations(observationData.points);

            // ✅ NEW: Extract least count data for CTG
            const leastCountMap = {};
            observationData.points.forEach(point => {
              if (point.id && point.least_count) {
                leastCountMap[point.id] = parseFloat(point.least_count);
              }
            });
            setLeastCountData(leastCountMap);

            if (observationTemplate === 'observationctg' && observationData.thermal_coeff) {
              setThermalCoeff({
                uuc: observationData.thermal_coeff.uuc || '',
                master: observationData.thermal_coeff.master || '',
              });
            }
          } else if (observationTemplate === 'observationtm') {
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
            const ucData = observationData.data || observationData;

            if (ucData.measure_data || ucData.source_data) {
              const combined = [];
              if (Array.isArray(ucData.measure_data)) {
                combined.push(...ucData.measure_data.map(p => ({ ...p, mode: 'Measure', cusset_error: p.cusset_error ?? ucData.cusset_error })));
              }
              if (Array.isArray(ucData.source_data)) {
                combined.push(...ucData.source_data.map(p => ({ ...p, mode: 'Source', cusset_error: p.cusset_error ?? ucData.cusset_error })));
              }

              // PHP validates observation columns with inleastcount/divisibleby against
              // crfmatrix.leastcount (Measure, readings on UUC) or mastermatrix.leastcount
              // (Source, readings on master). Keep the raw string so its decimal count is
              // preserved; least_count_uuc/least_count_master are decimal counts, not LCs.
              const leastCountMap = {};
              combined.forEach(point => {
                const calibPointId = point.point_id?.toString() || point.calibration_point_id?.toString() || point.id?.toString();
                if (!calibPointId) return;
                const obsLc = point.mode === 'Measure'
                  ? (point.leastcount ?? point.least_count)
                  : (point.master_leastcount ?? point.masterleastcount);
                leastCountMap[calibPointId] = { obs: obsLc != null ? String(obsLc).trim() : null };
              });
              setLeastCountData(prev => ({ ...prev, ...leastCountMap }));
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
          } else if (observationTemplate === 'observationvht') {
            const points = Array.isArray(observationData)
              ? observationData
              : (observationData.data || observationData.calibration_points || []);
            setObservations(Array.isArray(points) ? points : []);
          } else if (observationTemplate === 'observationvol') {
            const points = Array.isArray(observationData)
              ? observationData
              : (observationData.data || observationData.calibration_points || []);

            // Ambient/water temperature and pressure are stored against the
            // instrument, not a calibration point.
            const instData =
              observationData.instrument_data
              || observationData.environment
              || observationData.instrument
              || {};

            const pick = (...keys) => {
              for (const k of keys) {
                if (instData[k] !== undefined && instData[k] !== null && instData[k] !== '') return instData[k];
              }
              return '';
            };

            const volInst = {
              ambienttemp: pick('ambienttemp', 'ambient_temp'),
              watertemp: pick('watertemp', 'water_temp'),
              pressure: pick('pressure', 'air_pressure'),
            };
            setVolInstrumentData(volInst);
            setTableInputValues(prev => ({
              ...prev,
              [`${instId}-ambienttemp`]: volInst.ambienttemp,
              [`${instId}-watertemp`]: volInst.watertemp,
              [`${instId}-pressure`]: volInst.pressure,
            }));

            setObservations(Array.isArray(points) ? points : []);
          } else if (observationTemplate === 'observationvolnl') {
            const points = Array.isArray(observationData)
              ? observationData
              : (observationData.data || observationData.calibration_points || []);

            // Material coefficient, water temperature and air pressure are stored
            // against the instrument, not a calibration point.
            const instData =
              observationData.instrument_data
              || observationData.environment
              || observationData.instrument
              || {};

            const pick = (...keys) => {
              for (const k of keys) {
                if (instData[k] !== undefined && instData[k] !== null && instData[k] !== '') return instData[k];
              }
              return '';
            };

            const volnlInst = {
              materialcofficient: pick('materialcofficient', 'material_coefficient'),
              watertemp: pick('watertemp', 'water_temp', 'water_temp_start'),
              watertemp2: pick('watertemp2', 'water_temp2', 'water_temp_end'),
              pressure: pick('pressure', 'air_pressure', 'air_pressure_start'),
              pressure2: pick('pressure2', 'air_pressure2', 'air_pressure_end'),
            };
            setVolnlInstrumentData(volnlInst);
            setTableInputValues(prev => ({
              ...prev,
              [`${instId}-materialcofficient`]: volnlInst.materialcofficient,
              [`${instId}-watertemp`]: volnlInst.watertemp,
              [`${instId}-watertemp2`]: volnlInst.watertemp2,
              [`${instId}-pressure`]: volnlInst.pressure,
              [`${instId}-pressure2`]: volnlInst.pressure2,
            }));

            setObservations(Array.isArray(points) ? points : []);
          } else if (observationTemplate === 'observationts') {
            const uucCoeff = observationData.thermal_coefficient_uuc ?? observationData.thermal_coefficients?.uuc ?? observationData.thermal_coeff?.uuc ?? '';
            const masterCoeff = observationData.thermal_coefficient_master ?? observationData.thermal_coefficients?.master ?? observationData.thermal_coeff?.master ?? '';
            if (uucCoeff || masterCoeff) {
              setThermalCoeff(prev => ({
                ...prev,
                uuc: uucCoeff,
                master: masterCoeff
              }));
            }

            let tsData = Array.isArray(observationData) ? observationData : (observationData.data || []);
            const leastCountMap = {};
            const seededValues = {};

            // Map readings to observations for createObservationRows compatibility
            tsData = tsData.map((point, pointIdx) => {
              const calibPointId = point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString();
              let masterLcDecPlaces = 2; // Default

              if (calibPointId) {
                const masterLc = point.master_matrix?.leastcount ?? point.least_count ?? point.masterleastcount ?? 0.01;
                // ✅ Calculate decimal places from least count
                const masterLcStr = String(masterLc);
                masterLcDecPlaces = (masterLcStr.split('.')[1] || '').length || 2;

                const ids = [point.calibration_point_id, point.point_id, point.id].filter(Boolean);
                ids.forEach(id => {
                  leastCountMap[id.toString()] = {
                    master: parseFloat(masterLc) || 0.01,
                    masterLeastCountStr: String(masterLc)
                  };
                });
              }
              const observations = point.observations ? [...point.observations] : [];
              const averages = [];
              if (point.readings && Array.isArray(point.readings)) {
                point.readings.forEach((r, idx) => {
                  const globalRowIdx = pointIdx * 5 + idx;
                  if (r.values && Array.isArray(r.values)) {
                    r.values.forEach((vObj) => {
                      // ✅ FIXED: Use proper decimal places from least count, not hardcoded 2
                      const cleanVal = sanitizeSieveVal(vObj.value, masterLcDecPlaces);
                      observations.push({ ...vObj, value: cleanVal });
                      const repParts = String(vObj.repeatable || '').split('-');
                      if (repParts.length === 2) {
                        const colIdx = parseInt(repParts[1], 10) + 1;
                        seededValues[`${globalRowIdx}-${colIdx}`] = cleanVal;
                      }
                    });
                  }
                  let rowAvg = '';
                  if (r.average !== undefined && r.average !== null && String(r.average).trim() !== '') {
                    const numAvg = parseFloat(r.average);
                    rowAvg = !isNaN(numAvg) ? numAvg.toFixed(masterLcDecPlaces) : String(r.average);
                  } else if (r.values && Array.isArray(r.values) && r.values.length > 0) {
                    const nums = r.values.map(v => parseFloat(v.value)).filter(n => !isNaN(n));
                    if (nums.length > 0) {
                      rowAvg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(masterLcDecPlaces);
                    }
                  }
                  if (rowAvg) {
                    averages.push({ repeatable: idx.toString(), value: rowAvg });
                    seededValues[`${globalRowIdx}-9`] = rowAvg;
                  }
                });
              }
              return { ...point, observations, averages };
            });

            if (Object.keys(leastCountMap).length > 0) {
              setLeastCountData(prev => ({ ...prev, ...leastCountMap }));
            }
            if (Object.keys(seededValues).length > 0) {
              setTableInputValues(prev => ({ ...prev, ...seededValues }));
            }
            setObservations(tsData);
          } else if (observationTemplate === 'observationcustom') {
            if (observationData.instrument_settings) {
              setCustomSettings(observationData.instrument_settings);
              setInstrument(prev => ({ ...prev, ...observationData.instrument_settings }));
            }
            const points = observationData.calibration_points || observationData.points || observationData.data || (Array.isArray(observationData) ? observationData : []);
            setObservations(Array.isArray(points) ? points : []);
          } else if (observationTemplate === 'observationbiomedical') {
            const formatPoint = (p, mode, isSafety) => {
              let effectiveLc = p.least_count;
              let effectiveLcDec = (p.lc_decimals != null && p.lc_decimals !== 'NA' && p.lc_decimals !== '') ? parseInt(p.lc_decimals, 10) : null;

              const mlc = p.master_least_count;
              const mlcDec = (p.mlc_decimals != null && p.mlc_decimals !== 'NA' && p.mlc_decimals !== '') ? parseInt(p.mlc_decimals, 10) : null;

              if (mlc && mlc !== 'NA') {
                const numLc = parseFloat(effectiveLc);
                if (!effectiveLc || effectiveLc === 'NA' || isNaN(numLc)) {
                  effectiveLc = mlc;
                  effectiveLcDec = mlcDec;
                }
              }

              return {
                ...p,
                id: p.id || p.calibration_point_id,
                mode,
                is_electrical_safety: isSafety,
                least_count: effectiveLc ?? p.least_count,
                lc_decimals: effectiveLcDec ?? p.lc_decimals,
              };
            };

            const measure = Array.isArray(observationData.performance_test?.measure) ? observationData.performance_test.measure : [];
            const source = Array.isArray(observationData.performance_test?.source) ? observationData.performance_test.source : [];
            const safetyMeasure = Array.isArray(observationData.electrical_safety?.measure) ? observationData.electrical_safety.measure : [];
            const safetySource = Array.isArray(observationData.electrical_safety?.source) ? observationData.electrical_safety.source : [];

            const allPoints = [
              ...measure.map(p => formatPoint(p, 'Measure', false)),
              ...source.map(p => formatPoint(p, 'Source', false)),
              ...safetyMeasure.map(p => formatPoint(p, 'Measure', true)),
              ...safetySource.map(p => formatPoint(p, 'Source', true))
            ];
            setObservations(allPoints);

            // Seed tableInputValues from API data so saved readings show on reload
            const seeded = {};
            allPoints.forEach(p => {
              const pid = p.id;
              // Individual master readings
              if (Array.isArray(p.master_readings)) {
                p.master_readings.forEach((r, i) => {
                  if (r.value !== null && r.value !== undefined) {
                    seeded[`${pid}-master-${i}`] = r.value;
                  }
                });
              }
              // Individual UUC readings
              if (Array.isArray(p.uuc_readings)) {
                p.uuc_readings.forEach((r, i) => {
                  if (r.value !== null && r.value !== undefined) {
                    seeded[`${pid}-uuc-${i}`] = r.value;
                  }
                });
              }
              // NOTE: average_master and average_uuc are intentionally NOT seeded into
              // tableInputValues. The backend may store LC-rounded (incorrect) values.
              // ObservationBiomedical.jsx recalculates these fresh from individual readings via
              // calculateAverage(), and CalibrateStep3 submit also recalculates from readings.
              // Seeding them here would cause the stale stored value to override the fresh calculation.
              if (p.deviation !== null && p.deviation !== undefined) {
                seeded[`${pid}-error`] = p.deviation;
              }
              // Format & seed tolerance / specification
              const rawTol = p.tolerance ?? p.tolerance_value ?? p.specification ?? '';
              const tolType = (p.tolerance_type || '').trim();
              const formattedTol = tolType === '%' && rawTol && !String(rawTol).includes('%')
                ? `${rawTol}%`
                : String(rawTol || '');
              if (formattedTol) {
                seeded[`${pid}-specification`] = formattedTol;
              }
            });

            // Merge localStorage cache — individual readings cached locally take priority
            // over null values from the API (backend saves readings but may return null)
            try {
              const cacheKey = `bio_obs_${inwardId}_${instId}`;
              const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
              // Cache wins for individual readings only.
              // averagemaster/averageuuc are intentionally skipped — they are recalculated fresh.
              Object.entries(cached).forEach(([k, v]) => {
                const isIndividual = /-master-\d+$/.test(k) || /-uuc-\d+$/.test(k);
                const isAverage = /-averagemaster$/.test(k) || /-averageuuc$/.test(k);
                if (isAverage) return; // always recalculate, never use stale cached average
                if (isIndividual) {
                  seeded[k] = v; // local cache overrides null from API
                } else if (seeded[k] === undefined || seeded[k] === null || seeded[k] === '') {
                  seeded[k] = v; // use cache only if API didn't return a value
                }
              });
            } catch { /* ignore storage errors */ }


            if (Object.keys(seeded).length > 0) {
              setTableInputValues(prev => ({ ...prev, ...seeded }));
            }

            // Load visual test and basic safety data from biomedical API response
            const visualList = Array.isArray(observationData.visual_test)
              ? observationData.visual_test
              : (Array.isArray(observationData.visual_inspection) ? observationData.visual_inspection : null);
            if (visualList) {
              setVisualTests(visualList);
              // Seed input values from saved API data
              const vtInputs = {};
              visualList.forEach((t, i) => {
                const val = t.value ?? t.remark ?? '';
                const k = (t.id !== undefined && t.id !== null) ? t.id : i;
                vtInputs[k] = val;
              });
              setVisualTestInputs(vtInputs);
            }
            const safetyList = Array.isArray(observationData.basic_safety)
              ? observationData.basic_safety
              : (Array.isArray(observationData.basic_safety_test) ? observationData.basic_safety_test : null);
            if (safetyList) {
              const mappedSafety = safetyList.map(t => ({
                ...t,
                minrange: t.min_range ?? t.minrange,
                maxrange: t.max_range ?? t.maxrange,
              }));
              setSafetyTests(mappedSafety);
              // Seed input values from saved API data
              const stInputs = {};
              mappedSafety.forEach((t, i) => {
                const rawVal = typeof t.value === 'object' && t.value !== null ? (t.value.value ?? '') : (t.value ?? '');
                const k = (t.id !== undefined && t.id !== null) ? t.id : i;
                stInputs[k] = rawVal;
              });
              setSafetyTestInputs(stInputs);
            }

            // Sync config flags into state and instrument so visibility checks work
            if (observationData.config) {
              const cfg = observationData.config;
              setBiomedicalConfig(cfg);
              setInstrument(prev => ({
                ...prev,
                biomedical: cfg.biomedical ?? prev?.biomedical ?? 'Yes',
                showvisualtest: cfg.show_visual_test ?? prev?.showvisualtest ?? 'No',
                showbasicsafety: cfg.show_basic_safety ?? prev?.showbasicsafety ?? 'No',
                showelectricalsafety: cfg.show_electrical_safety ?? prev?.showelectricalsafety ?? 'No',
                showperformancetest: (cfg.show_performance ?? cfg.show_performance_test) ?? prev?.showperformancetest ?? 'No',
                mastercount: cfg.master_count ?? prev?.mastercount,
                uuccount: cfg.uuc_count ?? prev?.uuccount,
              }));
            }
          } else if (observationTemplate === 'observationwbn') {
            const dataObj = observationData.data || observationData;

            // Check if we have the new structured format
            if (dataObj.weighing_process || dataObj.repeatability || dataObj.eccentricity) {
              // Set observations to combined points for backward compatibility
              let allPoints = [];
              if (dataObj.weighing_process?.rows) {
                allPoints.push(...dataObj.weighing_process.rows.map(p => ({ ...p, mode: 'Weighing Process' })));
              }
              if (dataObj.repeatability?.rows) {
                allPoints.push(...dataObj.repeatability.rows.map(p => ({ ...p, mode: 'Repeatability' })));
              }
              if (dataObj.eccentricity?.rows) {
                allPoints.push(...dataObj.eccentricity.rows.map(p => ({ ...p, mode: 'Eccentricity' })));
              }

              // Attach the structured data to the first point so it can be retrieved in observationTables
              if (allPoints.length > 0) {
                allPoints[0].__wbn_structured_data = {
                  weighing_process: dataObj.weighing_process,
                  repeatability: dataObj.repeatability,
                  eccentricity: dataObj.eccentricity
                };
              }

              setObservations(allPoints);

              // Seed existing readings if present for observationwbn
              const seededValues = {};
              const weighingPts = allPoints.filter(p => p.mode?.toLowerCase().includes('weighing'));
              const repeatPts = allPoints.filter(p => p.mode?.toLowerCase().includes('repeatability'));
              const eccenPts = allPoints.filter(p => p.mode?.toLowerCase().includes('eccentricity'));

              weighingPts.forEach((point, rIdx) => {
                if (Array.isArray(point.uuc_observations)) {
                  point.uuc_observations.forEach((u, uIdx) => {
                    if (u?.value !== null && u?.value !== undefined && uIdx < 3) {
                      seededValues[`${rIdx}-${uIdx + 2}`] = u.value;
                    }
                  });
                }
                if (point.average_uuc !== null && point.average_uuc !== undefined) {
                  seededValues[`${rIdx}-5`] = point.average_uuc;
                }
                if (point.error !== null && point.error !== undefined) {
                  seededValues[`${rIdx}-6`] = point.error;
                }
              });

              const rOffset = weighingPts.length;
              repeatPts.forEach((point, rIdx) => {
                const actualRow = rOffset + rIdx;
                if (Array.isArray(point.uucr_observations)) {
                  point.uucr_observations.forEach((u, uIdx) => {
                    if (u?.value !== null && u?.value !== undefined && uIdx < 5) {
                      seededValues[`${actualRow}-${uIdx + 1}`] = u.value;
                    }
                  });
                }
                if (point.average_uucr !== null && point.average_uucr !== undefined) {
                  seededValues[`${actualRow}-6`] = point.average_uucr;
                }
              });

              const eOffset = rOffset + repeatPts.length;
              eccenPts.forEach((point, rIdx) => {
                const actualRow = eOffset + rIdx;
                if (Array.isArray(point.clockwise_observations)) {
                  point.clockwise_observations.forEach((u, uIdx) => {
                    if (u?.value !== null && u?.value !== undefined && uIdx < 5) {
                      seededValues[`${actualRow}-${uIdx + 1}`] = u.value;
                    }
                  });
                }
                if (Array.isArray(point.anticlockwise_observations)) {
                  point.anticlockwise_observations.forEach((u, uIdx) => {
                    if (u?.value !== null && u?.value !== undefined && uIdx < 5) {
                      seededValues[`${actualRow}-${uIdx + 6}`] = u.value;
                    }
                  });
                }
                if (point.eccentricity_d_value !== null && point.eccentricity_d_value !== undefined) {
                  seededValues[`${actualRow}-11`] = point.eccentricity_d_value;
                }
              });

              if (Object.keys(seededValues).length > 0) {
                setTableInputValues(prev => ({ ...prev, ...seededValues }));
              }


              // Seed least count data
              const leastCountMap = {};
              allPoints.forEach(point => {
                const calibPointId = point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString();
                if (calibPointId) {
                  const lcUucStr = point.least_count_uuc;
                  const lcMasterStr = point.least_count_master;
                  leastCountMap[calibPointId] = {
                    uuc: parseFloat(lcUucStr),
                    uucLeastCountStr: String(lcUucStr),
                    master: parseFloat(lcMasterStr),
                    masterLeastCountStr: String(lcMasterStr)
                  };
                }
              });
              if (Object.keys(leastCountMap).length > 0) {
                setLeastCountData(prev => ({ ...prev, ...leastCountMap }));
              }

              // Set diagram if provided
              if (dataObj.weighing_process?.diagrams && dataObj.weighing_process.diagrams.length > 0) {
                setDiagram(dataObj.weighing_process.diagrams[0].value);
              }
            } else {
              // Fallback to old format if new structure not present
              let allPoints = [];
              if (Array.isArray(dataObj.calibration_points)) {
                allPoints = dataObj.calibration_points;
              } else if (Array.isArray(dataObj)) {
                allPoints = dataObj;
              }
              setObservations(allPoints);

              const leastCountMap = {};
              allPoints.forEach(point => {
                const calibPointId = point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString();
                if (calibPointId) {
                  const lcUucStr = point.least_count_uuc || point.least_count || point.leastcount;
                  const lcMasterStr = point.least_count_master || point.master_least_count || point.masterleastcount;
                  leastCountMap[calibPointId] = {
                    uuc: parseFloat(lcUucStr),
                    uucLeastCountStr: String(lcUucStr),
                    master: parseFloat(lcMasterStr),
                    masterLeastCountStr: String(lcMasterStr)
                  };
                }
              });
              if (Object.keys(leastCountMap).length > 0) {
                setLeastCountData(prev => ({ ...prev, ...leastCountMap }));
              }
            }
          } else if (observationTemplate === 'observationwb') {
            let allPoints = [];
            const dataObj = observationData.data || observationData;
            if (dataObj.weighing_process || dataObj.repeatability || dataObj.eccentricity) {
              const wp = (dataObj.weighing_process?.calibration_points || []).map(p => ({ ...p, mode: 'Weighing Process' }));
              const rp = (dataObj.repeatability?.calibration_points || []).map(p => ({ ...p, mode: 'Repeatability' }));
              const ep = (dataObj.eccentricity?.calibration_points || []).map(p => ({ ...p, mode: 'Eccentricity' }));
              allPoints = [...wp, ...rp, ...ep];
            } else if (Array.isArray(dataObj.calibration_points)) {
              allPoints = dataObj.calibration_points;
            } else if (Array.isArray(dataObj)) {
              allPoints = dataObj;
            }

            const leastCountMap = {};
            allPoints.forEach(point => {
              const calibPointId = point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString();
              if (calibPointId) {
                const lcUucStr = point.least_count_uuc || '0.01';
                const lcMasterStr = point.least_count_master || '0.01';
                leastCountMap[calibPointId] = {
                  uuc: parseFloat(lcUucStr) || 0.01,
                  uucLeastCountStr: String(lcUucStr),
                  master: parseFloat(lcMasterStr) || 0.01,
                  masterLeastCountStr: String(lcMasterStr)
                };
              }
            });
            if (Object.keys(leastCountMap).length > 0) {
              setLeastCountData(prev => ({ ...prev, ...leastCountMap }));
            }
            if (observationData.diagram || dataObj.diagram || observationData.daigram || dataObj.daigram) {
              setDiagram(observationData.diagram || dataObj.diagram || observationData.daigram || dataObj.daigram);
            }

            // Seed existing readings if present
            const seededValues = {};
            const weighingPts = allPoints.filter(p => p.mode?.toLowerCase().includes('weighing'));
            const repeatPts = allPoints.filter(p => p.mode?.toLowerCase().includes('repeatability'));
            const eccenPts = allPoints.filter(p => p.mode?.toLowerCase().includes('eccentricity'));

            weighingPts.forEach((point, rIdx) => {
              if (Array.isArray(point.uuc_observations)) {
                point.uuc_observations.forEach((u, uIdx) => {
                  if (u?.value !== null && u?.value !== undefined && uIdx < 3) {
                    seededValues[`${rIdx}-${uIdx + 2}`] = u.value;
                  }
                });
              }
              if (point.average_uuc !== null && point.average_uuc !== undefined) {
                seededValues[`${rIdx}-5`] = point.average_uuc;
              }
              if (point.error !== null && point.error !== undefined) {
                seededValues[`${rIdx}-6`] = point.error;
              }
            });

            const rOffset = weighingPts.length;
            repeatPts.forEach((point, rIdx) => {
              const actualRow = rOffset + rIdx;
              if (Array.isArray(point.uucr_observations)) {
                point.uucr_observations.forEach((u, uIdx) => {
                  if (u?.value !== null && u?.value !== undefined && uIdx < 10) {
                    seededValues[`${actualRow}-${uIdx + 1}`] = u.value;
                  }
                });
              }
              if (point.average_uucr !== null && point.average_uucr !== undefined) {
                seededValues[`${actualRow}-6`] = point.average_uucr;
              }
            });

            const eOffset = rOffset + repeatPts.length;
            eccenPts.forEach((point, rIdx) => {
              const actualRow = eOffset + rIdx;
              if (Array.isArray(point.clockwise_observations)) {
                point.clockwise_observations.forEach((u, uIdx) => {
                  if (u?.value !== null && u?.value !== undefined && uIdx < 5) {
                    seededValues[`${actualRow}-${uIdx + 1}`] = u.value;
                  }
                });
              }
              if (Array.isArray(point.anticlockwise_observations)) {
                point.anticlockwise_observations.forEach((u, uIdx) => {
                  if (u?.value !== null && u?.value !== undefined && uIdx < 5) {
                    seededValues[`${actualRow}-${uIdx + 6}`] = u.value;
                  }
                });
              }
              if (point.eccentricity_d_value !== null && point.eccentricity_d_value !== undefined) {
                seededValues[`${actualRow}-11`] = point.eccentricity_d_value;
              }
            });

            if (Object.keys(seededValues).length > 0) {
              setTableInputValues(prev => ({ ...prev, ...seededValues }));
            }

            setObservations(allPoints);
          } else {
            setObservations([]);
          }
        } else {
          setObservations([]);
        }
      } catch {
        setObservations([]);
      }
    };

    fetchObservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // TSWOI: both rows of the point that rowIndex belongs to (UUC row, then Master row),
  // with current input values applied over the static rows
  const getTSWOIPointRows = (rowIndex, values = tableInputValues) => {
    const staticRows = selectedTableData?.staticRows || [];
    const uucIndex = getTSWOIRowType(staticRows[rowIndex]) === 'uuc' ? rowIndex : rowIndex - 1;
    const masterIndex = uucIndex + 1;
    const buildRow = (idx) => (staticRows[idx] || []).map((cell, c) => values[`${idx}-${c}`] ?? (cell?.toString() || ''));
    return { uucIndex, masterIndex, uucRow: buildRow(uucIndex), masterRow: buildRow(masterIndex) };
  };

  // TSWOI points are one per two rows; cusset_error is copied onto each point on load
  const getTSWOICussetError = (rowIndex) => observations?.[Math.floor(rowIndex / 2)]?.cusset_error;

  // TSWOI: recalculate a whole point and write its calculated cells into values
  const applyTSWOICalculations = (values, rowIndex) => {
    const { uucIndex, masterIndex, uucRow, masterRow } = getTSWOIPointRows(rowIndex, values);
    const calc = calculateTSWOIPoint(uucRow, masterRow, getTSWOICussetError(rowIndex));
    values[`${uucIndex}-${TSWOI_COLS.AVERAGE}`] = calc.uuc.average;
    values[`${uucIndex}-${TSWOI_COLS.CORRECTED_AVERAGE}`] = calc.uuc.correctedAverage;
    values[`${masterIndex}-${TSWOI_COLS.AVERAGE}`] = calc.master.average;
    values[`${masterIndex}-${TSWOI_COLS.CORRECTED_AVERAGE}`] = calc.master.correctedAverage;
    values[`${uucIndex}-${TSWOI_COLS.DEVIATION}`] = calc.error;
    return { uucIndex, masterIndex, calc };
  };

  // TSWI: same UUC/Master row pairing as TSWOI (getTSWOIPointRows only reads the
  // 'UUC'/'Master' label in col 2); recalculates the point and writes its calculated cells
  const applyTSWICalculations = (values, rowIndex) => {
    const { uucIndex, masterIndex, uucRow, masterRow } = getTSWOIPointRows(rowIndex, values);
    const calc = calculateTSWIPoint(uucRow, masterRow, selectedTableData?.rowMeta?.[rowIndex], getTSWOICussetError(rowIndex));
    values[`${uucIndex}-${TSWI_COLS.CONVERTED_AVERAGE}`] = calc.uuc.average;
    values[`${masterIndex}-${TSWI_COLS.AVERAGE}`] = calc.master.average;
    values[`${masterIndex}-${TSWI_COLS.CORRECTED_AVERAGE}`] = calc.master.correctedAverage;
    values[`${uucIndex}-${TSWI_COLS.DEVIATION}`] = calc.error;
    return { uucIndex, masterIndex, calc };
  };

  // SW: same UUC/Master row pairing as TSWOI. After a reading changes, recalculates
  // that row's average and the error (from the new average and the other row's
  // current average, as PHP's onkeyup averageavg + substractminus do)
  const applySWCalculations = (values, rowIndex) => {
    const { uucIndex, masterIndex, uucRow, masterRow } = getTSWOIPointRows(rowIndex, values);
    const meta = selectedTableData?.rowMeta?.[rowIndex];
    const newAverage = calculateSWAverage(rowIndex === uucIndex ? uucRow : masterRow, meta);
    values[`${rowIndex}-${SW_COLS.AVERAGE}`] = newAverage;
    const uucAverage = rowIndex === uucIndex ? newAverage : uucRow[SW_COLS.AVERAGE];
    const masterAverage = rowIndex === masterIndex ? newAverage : masterRow[SW_COLS.AVERAGE];
    values[`${uucIndex}-${SW_COLS.ERROR}`] = calculateSWError(uucAverage, masterAverage, meta, getTSWOICussetError(rowIndex));
    return { uucIndex, masterIndex };
  };

  // SUTM: one row per point. Recalculates both set speeds, the mean speed and the
  // error from the row's displacement/time inputs and writes them into values
  const applySUTMCalculations = (values, rowIndex) => {
    const staticRow = selectedTableData?.staticRows?.[rowIndex] || [];
    const rowData = staticRow.map((cell, c) => values[`${rowIndex}-${c}`] ?? (cell?.toString() || ''));
    const cells = getSUTMCalculatedCells(rowData, selectedTableData?.rowMeta?.[rowIndex], observations?.[rowIndex]?.cusset_error);
    Object.entries(cells).forEach(([col, val]) => {
      values[`${rowIndex}-${col}`] = val;
    });
    return cells;
  };

  const calculateRowValues = (rowData, template, rowIndex) => {
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
      Object.assign(result, calculateUCValues(rowData, rowIndex, observations));
    }
    else if (template === 'observationth') {
      const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex] || selectedTableData?.calibrationPoints?.[rowIndex];
      Object.assign(result, calculateTHValues(rowData, calibPointId, leastCountData));
    }
    else if (template === 'observationts') {
      const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex] || selectedTableData?.calibrationPoints?.[rowIndex];
      const lcInfo = leastCountData[calibPointId];
      const masterLc = typeof lcInfo === 'object' ? (lcInfo?.master ?? 0.01) : (parseFloat(lcInfo) || 0.01);
      const masterLcStr = (typeof lcInfo === 'object' && lcInfo?.masterLeastCountStr) ? lcInfo.masterLeastCountStr : masterLc?.toString();
      const decPlaces = masterLcStr && masterLcStr.includes('.') ? (masterLcStr.split('.')[1] || '').length : 2;
      Object.assign(result, calculateTSValues(rowData, decPlaces));
    } else if (template === 'observationwbn') {
      const point = observations?.[rowIndex];
      const wbnResult = calculateWBNValues(rowData, rowIndex, selectedTableData, instrument, point);
      Object.assign(result, wbnResult);
      if (wbnResult.weighingAverage !== undefined) result.average = wbnResult.weighingAverage;
      if (wbnResult.weighingError !== undefined) result.error = wbnResult.weighingError;
      if (wbnResult.repeatabilityAverage !== undefined) result.repeatability = wbnResult.repeatabilityAverage;
    } else if (template === 'observationdpg') {
      const point = observations?.[rowIndex];
      Object.assign(result, calculateDPGValues(rowData, point, instrument));
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

      // Dynamic decimals based on least count
      const point = observations?.[rowIndex];
      const lc = point?.least_count || instrument?.least_count || inwardEntry?.least_count || '0.01';
      let d = 2;
      if (lc) {
        const match = String(lc).match(/\.([0-9]+)/);
        if (match) d = match[1].length;
        else if (!isNaN(parseFloat(lc))) d = 0;
      }

      // Average Forward Reading = (Set1Forward + Set2Forward) / 2
      const avgForward = (set1Forward + set2Forward) / 2;
      result.averageForward = !isNaN(avgForward) && (rowData[2] || rowData[4]) ? avgForward.toFixed(d) : '';

      // Average Backward Reading = (Set1Backward + Set2Backward) / 2
      const avgBackward = (set1Backward + set2Backward) / 2;
      result.averageBackward = !isNaN(avgBackward) && (rowData[3] || rowData[5]) ? avgBackward.toFixed(d) : '';

      // Error Forward = Average Forward - Nominal Value
      result.errorForward = result.averageForward !== '' && nominalValue !== undefined && !isNaN(nominalValue)
        ? (avgForward - nominalValue).toFixed(d)
        : '';

      // Error Backward = Average Backward - Nominal Value
      result.errorBackward = result.averageBackward !== '' && nominalValue !== undefined && !isNaN(nominalValue)
        ? (avgBackward - nominalValue).toFixed(d)
        : '';

      // Hysterisis = Average Forward - Average Backward
      result.hysteresis = result.averageForward !== '' && result.averageBackward !== ''
        ? (avgForward - avgBackward).toFixed(d)
        : '';

    } else if (template === 'observationmsr') {
      Object.assign(result, calculateMSRValues(rowData));
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

    } else if (template === 'observationfg') {
      const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex] || selectedTableData?.calibrationPoints?.[rowIndex];
      Object.assign(result, calculateFGValues(rowData, calibPointId, leastCountData));
    } else if (template === 'observationhg') {
      Object.assign(result, calculateHGValues(rowData));
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

    }
    else if (template === 'observationvc') {
      Object.assign(result, calculateVCValues(rowData));
    }
    else if (template === 'observationexm') {
      Object.assign(result, calculateEXMValues(rowData, rowIndex, selectedTableData, leastCountData, observations));
    }
    else if (template === 'observationrtdwi') {
      Object.assign(result, calculateRTDWIValues(rowData));
    }
    else if (template === 'observationtswoi') {
      // Deviation spans the point's UUC and Master rows, so pass the other row too
      const { uucIndex, uucRow, masterRow } = getTSWOIPointRows(rowIndex);
      const pairRow = rowIndex === uucIndex ? masterRow : uucRow;
      Object.assign(result, calculateTSWOIValues(rowData, pairRow, getTSWOICussetError(rowIndex)));
    }
    else if (template === 'observationtswi') {
      const { uucIndex, uucRow, masterRow } = getTSWOIPointRows(rowIndex);
      const pairRow = rowIndex === uucIndex ? masterRow : uucRow;
      Object.assign(result, calculateTSWIValues(rowData, pairRow, selectedTableData?.rowMeta?.[rowIndex], getTSWOICussetError(rowIndex)));
    }
    else if (template === 'observationmm') {
      Object.assign(result, calculateMMValues(rowData));
    } else if (template === 'observationodfm') {
      const obsValues = parsedValues.slice(3, 8).filter((val) => val !== 0);

      // Error is expressed in the master unit, so it follows the master least count
      const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex] || selectedTableData?.calibrationPoints?.[rowIndex];
      const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];
      const point = observations?.[rowIndex];
      const masterLc = (typeof lcInfo === 'object' ? (lcInfo?.masterStr ?? lcInfo?.master) : null)
        ?? point?.metadata?.master_least_count
        ?? point?.master_least_count
        ?? point?.masterleastcount;
      const masterDec = (masterLc !== undefined && masterLc !== null && masterLc !== 'NA')
        ? getDecimalPlaces(masterLc)
        : 3;

      result.average = obsValues.length
        ? (obsValues.reduce((sum, val) => sum + val, 0) / obsValues.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[2];
      result.error = result.average && nominalValue
        ? (parseFloat(result.average) - nominalValue).toFixed(masterDec)
        : '';
    } else if (template === 'observationapg') {
      Object.assign(result, calculateAPGValues(rowData));
    } else if (template === 'observationit') {
      Object.assign(result, calculateITValues(rowData));
    } else if (template === 'observationmt') {
      Object.assign(result, calculateMTValues(rowData, rowIndex, selectedTableData, leastCountData, observations));
    } else if (template === 'observationctg') {
      Object.assign(result, calculateCTGValues(rowData));
    }
    else if (template === 'observationgtm') {
      Object.assign(result, calculateGTMValues(rowData, rowIndex, observations, instrument));
    }
    else if (template === 'observationpr') {
      const point = observations?.[rowIndex];
      const mlc = point?.master_least_count ?? point?.masterleastcount ?? 'NA';
      const readings = [rowData[2], rowData[3], rowData[4]];
      const calcs = calculatePRValues(rowData[1], readings, mlc);
      Object.assign(result, {
        averagemaster: calcs.mean,
        repeatability: calcs.repeatability,
        factor: calcs.factor,
      });
    }
    else if (template === 'observationtm') {
      const point = observations?.[rowIndex] || selectedTableData?.calibration_points?.[rowIndex];
      Object.assign(result, calculateTMValues(rowData, point, {
        errorMode: instrument?.error,
      }));
    }
    // ✅ DW calculation — isolated in ObservationDW.jsx
    else if (template === 'observationdw') {
      Object.assign(result, calculateDWValues(rowData));
    }
    else if (template === 'observationutm') {
      Object.assign(result, calculateUTMValues(rowData, rowIndex, selectedTableData));
    }
    else if (template === 'observationvol') {
      const point = observations?.[rowIndex] || selectedTableData?.calibration_points?.[rowIndex];
      Object.assign(result, calculateVOLValues(rowData, point, {
        errorMode: instrument?.error,
      }));
    }
    else if (template === 'observationvolnl') {
      const point = observations?.[rowIndex] || selectedTableData?.calibration_points?.[rowIndex];
      Object.assign(result, calculateVOLNLValues(rowData, point, {
        waterTempAvg: (parseFloat(tableInputValues[`${instId}-watertemp`]) + parseFloat(tableInputValues[`${instId}-watertemp2`])) / 2,
        errorMode: instrument?.error,
      }));
    }
    else if (template === 'observationwb') {
      const point = observations?.[rowIndex];
      Object.assign(result, calculateWBValues(rowData, rowIndex, selectedTableData, instrument, point));
    }
    else if (template === 'observationcustom') {
      const point = observations?.[rowIndex];
      Object.assign(result, calculateCustomValues(rowData, getCustomInstrument(), point));
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
        dataArray.forEach((point, pointIndex) => {
          if (!point) return;

          const row = Array(layout.totalCols).fill('');
          row[0] = (point.sr_no ?? point.srno ?? (pointIndex + 1))?.toString() || '';

          if (layout.paramIdx !== -1) row[layout.paramIdx] = extractPointValue(point, 'parameter');
          if (layout.specIdx !== -1) row[layout.specIdx] = extractPointValue(point, 'specification');
          if (layout.setpointIdx !== -1) {
            let spVal = extractPointValue(point, 'setpoint');
            if (!spVal && getCustomInstrument().setpoint === 'Master') {
              spVal = extractPointValue(point, 'master', 0);
            } else if (!spVal && getCustomInstrument().setpoint === 'UUC') {
              spVal = extractPointValue(point, 'uuc', 0);
            }
            if (!spVal) {
              spVal = safeGetValue(point.point ?? point.nominal_value ?? point.test_point ?? '');
            }
            row[layout.setpointIdx] = spVal;
          }

          layout.masterObsIndices.forEach((idx, i) => {
            row[idx] = extractPointValue(point, 'master', i);
          });
          if (layout.avgMasterIdx !== -1) row[layout.avgMasterIdx] = extractPointValue(point, 'averagemaster');

          layout.uucObsIndices.forEach((idx, i) => {
            row[idx] = extractPointValue(point, 'uuc', i);
          });
          if (layout.avgUucIdx !== -1) row[layout.avgUucIdx] = extractPointValue(point, 'averageuuc');

          if (layout.errorIdx !== -1) {
            const calculated = calculateCustomValues(row, instrument, point);
            row[layout.errorIdx] = (calculated.error !== '' && calculated.error !== undefined)
              ? calculated.error
              : extractPointValue(point, 'error');
          }
          if (layout.remarkIdx !== -1) row[layout.remarkIdx] = extractPointValue(point, 'remark');

          rows.push(row);
          calibrationPoints.push((point.point_id ?? point.id ?? point.pointid)?.toString() || '');
          types.push('uuc');
          repeatables.push('0');
          values.push(extractPointValue(point, 'setpoint') || '');
        });
      }
    } else if (template === 'observationwbn') {
      dataArray.forEach((point) => {
        if (!point) return;

        const mode = point.mode?.toLowerCase() || '';
        let row = [];

        if (mode.includes('weighing')) {
          const wReadings = safeGetArray(point.uuc_observations || point.observations, 3);
          while (wReadings.length < 3) wReadings.push('');
          row = [
            point.sr_no?.toString() || '',
            safeGetValue(point.nominal_value || point.test_point || point.point),
            ...wReadings.slice(0, 3).map(obs => safeGetValue(typeof obs === 'object' ? obs?.value : obs)),
            safeGetValue(point.average_uuc || point.average),
            safeGetValue(point.error)
          ];
        } else if (mode.includes('repeatability')) {
          const rReadings = safeGetArray(point.uucr_observations || point.uucr, 5);
          while (rReadings.length < 5) rReadings.push('');
          row = [
            safeGetValue(point.nominal_value || point.test_point || point.point),
            ...rReadings.slice(0, 5).map(obs => safeGetValue(typeof obs === 'object' ? obs?.value : obs)),
            safeGetValue(point.average_uucr || point.averageuucr)
          ];
        } else if (mode.includes('eccentricity')) {
          const cwReadings = safeGetArray(point.clockwise_observations, 5);
          const acwReadings = safeGetArray(point.anticlockwise_observations, 5);
          const eReadings = [...cwReadings, ...acwReadings];
          while (eReadings.length < 10) eReadings.push('');
          row = [
            safeGetValue(point.nominal_value || point.test_point || point.point),
            ...eReadings.slice(0, 10).map(obs => safeGetValue(typeof obs === 'object' ? obs?.value : obs)),
            safeGetValue(point.eccentricity_d_value || point.eccentricity)
          ];
        } else {
          // Fallback if mode is missing (should not happen with new structure)
          row = [
            point.sr_no?.toString() || '',
            safeGetValue(point.nominal_value || point.test_point || point.point),
            ...Array(5).fill('')
          ];
        }

        rows.push(row);

        calibrationPoints.push((point.calibration_point_id ?? point.point_id ?? point.id)?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || '3');
        values.push(safeGetValue(point.nominal_value || point.test_point || point.point) || '0');
      });
    } else if (template === 'observationdpg') {
      return createDPGRows(dataArray, instrument);
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
      return createMSRRows(dataArray);
    }
    else if (template === 'observationgtm' || observationTemplate === 'observationgtm') {
      return createGTMRows(dataArray, instrument);
    }

    else if (template === 'observationpr' || observationTemplate === 'observationpr') {
      return createPRRows(dataArray);
    }

    else if (template === 'observationtm') {
      return createTMRows(dataArray);
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


        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.set_point_uuc) || '0');
      });
    }
    else if (observationTemplate === 'observationrtdwi' || template === 'observationrtdwi') {
      return createRTDWIRows(dataArray, observationData);
    } else if (template === 'observationtswoi') {
      return createTSWOIRows(dataArray);
    } else if (template === 'observationtswi') {
      return createTSWIRows(dataArray);
    } else if (template === 'observationsw') {
      return createSWRows(dataArray);
    } else if (template === 'observationsutm') {
      return createSUTMRows(dataArray);
    } else if (template === 'observationth') {
      return createTHRows(dataArray);
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


        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || point.calibration_point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.set_pressure?.uuc_value || point.uuc_value) || '0');
      });
    }

    else if (template === 'observationfg') {
      return createFGRows(dataArray);
    }

    else if (template === 'observationmm') {
      return createMMRows(dataArray);
    }

    else if (template === 'observationuc') {
      return createUCRows(dataArray);
    }
    else if (template === 'observationes') {

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
    else if (template === 'observationexm' || template === 'observationvc') {
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


        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    } else if (template === 'observationhg') {
      return createHGRows(dataArray);
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
      return createAPGRows(dataArray);
    } else if (template === 'observationit') {
      return createITRows(dataArray);
    }
    else if (template === 'observationmt') {
      return createMTRows(dataArray);
    }
    else if (template === 'observationctg') {
      return createCTGRows(dataArray);
    } else if (template === 'observationdw') {
      return createDWRows(dataArray);
    } else if (template === 'observationts') {
      return createTSRows(dataArray);
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
          const masterValues = [0, 1, 2].map((idx) => getObservationValueByType(point, 'master', idx));
          const calculatedUuc = getObservationValueByType(point, 'calculateduuc', 0);
          const rawUuc = getObservationValueByType(point, 'uuc', 0);
          const compensatedUuc = rawUuc || calculatedUuc || '';

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

          // Every pushed row must have a matching hiddenInputs/rowMeta entry, otherwise
          // the indexes shift and a point row resolves to the removal/zeroerror meta.
          const pointId = safeGetValue(
            point?.id ?? point?.point_id ?? point?.calibration_point_id ?? ''
          );
          calibrationPoints.push(pointId);
          types.push('master');
          repeatables.push('0');
          values.push(masterValues[0] || '0');
          rowMeta.push({ kind: 'point', matrixId, pointId });
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
      let normalizedData = dataArray;
      // If data is passed as a wrapper object or single object containing sections
      if (dataArray.length === 1 && (dataArray[0].weighing_process || dataArray[0].repeatability || dataArray[0].eccentricity)) {
        const d = dataArray[0];
        const wp = (d.weighing_process?.calibration_points || []).map(p => ({ ...p, mode: 'Weighing Process' }));
        const rp = (d.repeatability?.calibration_points || []).map(p => ({ ...p, mode: 'Repeatability' }));
        const ep = (d.eccentricity?.calibration_points || []).map(p => ({ ...p, mode: 'Eccentricity' }));
        normalizedData = [...wp, ...rp, ...ep];
      }

      const getObservationValue = (point, type, repeatable = 0) => {
        if (point.observations && Array.isArray(point.observations)) {
          const obs = point.observations.find(o => o.type === type && Number(o.repeatable) === repeatable);
          if (obs && obs.value !== null && obs.value !== undefined) return obs.value !== '' ? String(obs.value) : '';
        }

        // Direct reading arrays from API response
        if (type === 'uuc') {
          if (Array.isArray(point.uuc_observations) && point.uuc_observations[repeatable]) {
            const val = point.uuc_observations[repeatable]?.value;
            if (val !== null && val !== undefined) return val;
          }
          if (point.uuc_values && Array.isArray(point.uuc_values)) {
            return point.uuc_values[repeatable] || '';
          }
        }
        if (type === 'uucr') {
          if (Array.isArray(point.uucr_observations) && point.uucr_observations[repeatable]) {
            const val = point.uucr_observations[repeatable]?.value;
            if (val !== null && val !== undefined) return val;
          }
          if (point.uucr_values && Array.isArray(point.uucr_values)) {
            return point.uucr_values[repeatable] || '';
          }
        }
        if (type === 'uuce') {
          // repeatable 0-4: clockwise (position 1-5), repeatable 5-9: anticlockwise (position 1-5)
          if (repeatable < 5 && Array.isArray(point.clockwise_observations) && point.clockwise_observations[repeatable]) {
            const val = point.clockwise_observations[repeatable]?.value;
            if (val !== null && val !== undefined) return val;
          }
          if (repeatable >= 5 && Array.isArray(point.anticlockwise_observations) && point.anticlockwise_observations[repeatable - 5]) {
            const val = point.anticlockwise_observations[repeatable - 5]?.value;
            if (val !== null && val !== undefined) return val;
          }
          if (point.uuce_values && Array.isArray(point.uuce_values)) {
            return point.uuce_values[repeatable] || '';
          }
        }

        if (type === 'averageuuc' && (point.average_uuc !== undefined || point.averageuuc !== undefined)) {
          return point.average_uuc ?? point.averageuuc ?? '';
        }
        if (type === 'averageuucr' && (point.average_uucr !== undefined || point.averageuucr !== undefined)) {
          return point.average_uucr ?? point.averageuucr ?? '';
        }
        if (type === 'eccentricity' && (point.eccentricity_d_value !== undefined || point.eccentricity !== undefined)) {
          return point.eccentricity_d_value ?? point.eccentricity ?? '';
        }
        if (type === 'error' && point.error !== undefined && point.error !== null) return point.error;

        return '';
      };

      const weighingPoints = normalizedData.filter(p => p.mode?.toLowerCase().includes('weighing') || p.mode_name?.toLowerCase().includes('weighing'));
      const repeatabilityPoints = normalizedData.filter(p => p.mode?.toLowerCase().includes('repeatability') || p.mode_name?.toLowerCase().includes('repeatability'));
      const eccentricityPoints = normalizedData.filter(p => p.mode?.toLowerCase().includes('eccentricity') || p.mode_name?.toLowerCase().includes('eccentricity'));

      // 1. Weighing Process
      weighingPoints.forEach((point, pIndex) => {
        const uucReadings = [];
        for (let i = 0; i < 3; i++) {
          uucReadings.push(getObservationValue(point, 'uuc', i));
        }
        const row = [
          point.sr_no?.toString() || (pIndex + 1).toString(), // Sr no
          safeGetValue(point.point || point.nominal_value), // Nominal Value
          ...uucReadings, // Readings 1, 2, 3
          getObservationValue(point, 'averageuuc', 0), // Average
          getObservationValue(point, 'error', 0), // Error
        ];
        rows.push(row);
        calibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString() || '');
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
        calibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString() || '');
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
        calibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString() || '');
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

  const getCustomLayoutIndices = (inst) => {
    // The main instrument fetch replaces `instrument` wholesale and drops the
    // template settings; fall back to the copy captured from the observations call
    const instrument = (inst && inst.mastertoshow !== undefined) ? inst : getCustomInstrument();
    if (!instrument || instrument.mastertoshow === undefined) return null;
    let colIdx = 1;

    let hasParameter = instrument.parametertoshow === "Yes";
    let paramIdx = hasParameter ? colIdx++ : -1;

    let hasSpecification = instrument.specificationtoshow === "Yes";
    let specIdx = hasSpecification ? colIdx++ : -1;

    let masterdone = false;
    let uucdone = false;

    const masterCount = parseInt(instrument.master || 1);
    const uucCount = parseInt(instrument.uuc || 1);

    let hasSetpoint = instrument.setpointtoshow === "Yes";
    let setpointIdx = -1;

    if (hasSetpoint) {
      setpointIdx = colIdx++;
      if (instrument.setpoint === "Master") {
        masterdone = true;
      } else if (instrument.setpoint === "UUC") {
        uucdone = true;
      }
    }

    let masterObsIndices = [];
    let avgMasterIdx = -1;
    let uucObsIndices = [];
    let avgUucIdx = -1;

    const pushMaster = () => {
      for (let i = 0; i < masterCount; i++) masterObsIndices.push(colIdx++);
      if (masterCount > 1) avgMasterIdx = colIdx++;
      masterdone = true;
    };

    const pushUuc = () => {
      for (let i = 0; i < uucCount; i++) uucObsIndices.push(colIdx++);
      if (uucCount > 1) avgUucIdx = colIdx++;
      uucdone = true;
    };

    let order = 'master-first';
    if (instrument.mastertoshow === "Yes" && !masterdone && masterCount <= uucCount) {
      pushMaster();
      if (instrument.uuctoshow === "Yes" && !uucdone) pushUuc();
      order = 'master-first';
    } else {
      if (instrument.uuctoshow === "Yes" && !uucdone) pushUuc();
      if (instrument.mastertoshow === "Yes" && !masterdone) pushMaster();
      order = 'uuc-first';
    }

    let hasError = instrument.errortoshow === "Yes";
    let errorIdx = hasError ? colIdx++ : -1;

    let hasRemark = instrument.remarktoshow === "Yes";
    let remarkIdx = hasRemark ? colIdx++ : -1;

    return {
      paramIdx, specIdx, setpointIdx,
      masterObsIndices, avgMasterIdx,
      uucObsIndices, avgUucIdx,
      errorIdx, remarkIdx,
      totalCols: colIdx,
      masterCount, uucCount,
      order,
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
      if (instrument.uuctoshow === "Yes" && !uucdone) addUucObservations();
    } else {
      if (instrument.uuctoshow === "Yes" && !uucdone) addUucObservations();
      if (instrument.mastertoshow === "Yes" && !masterdone) addMasterObservations();
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
    getTHTableConfig(observations),
    {
      ...getVHTTableConfig(observations),
      calibration_points: Array.isArray(observations) ? observations : [],
    },
    {
      ...getVOLTableConfig(observations, inwardEntry?.conformitystatement === 'Yes'),
      calibration_points: Array.isArray(observations) ? observations : [],
      instrument_data: volInstrumentData,
      conformitystatement: inwardEntry?.conformitystatement,
    },
    {
      ...getVOLNLTableConfig(observations),
      calibration_points: Array.isArray(observations) ? observations : [],
      instrument_data: volnlInstrumentData,
    },
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
      id: 'observationbiomedical',
      name: 'Observation Biomedical',
      category: 'Biomedical',
      structure: { singleHeaders: [], subHeaders: {}, remainingHeaders: [] },
      staticRows: [],
      hiddenInputs: {},
      calibration_points: observations
    },
    (() => {
      const wbnData = createObservationRows(observations, 'observationwbn');
      const weighingPoints = observations.filter(p => p.mode?.toLowerCase().includes('weighing')).length;
      const repeatabilityPoints = observations.filter(p => p.mode?.toLowerCase().includes('repeatability')).length;
      const eccentricityPoints = observations.filter(p => p.mode?.toLowerCase().includes('eccentricity')).length;

      const config = {
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
        staticRows: wbnData.rows,
        hiddenInputs: wbnData.hiddenInputs,
        weighingCount: weighingPoints,
        repeatabilityCount: repeatabilityPoints,
        eccentricityCount: eccentricityPoints,
      };

      // If observations have the structured format with weighing_process, repeatability, eccentricity,
      // pass them through selectedTableData so ObservationWBN can render using the new structure
      if (observations.length > 0 && observations[0].__wbn_structured_data) {
        const structuredData = observations[0].__wbn_structured_data;
        config.weighing_process = structuredData.weighing_process;
        config.repeatability = structuredData.repeatability;
        config.eccentricity = structuredData.eccentricity;
      }

      return config;
    })(),
    getUCTableConfig(observations),
    getDWTableConfig(observations),
    getTSTableConfig(observations),
    getDPGTableConfig(observations, instrument),
    getTMTableConfig(observations),
    {
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

    getMSRTableConfig(observations),
    getRTDWITableConfig(observations),
    getTSWOITableConfig(observations),
    getTSWITableConfig(observations),
    getSWTableConfig(observations),
    getSUTMTableConfig(observations),
    getGTMTableConfig(observations, instrument),
    getPRTableConfig(observations, instrument), {
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
    },
    getHGTableConfig(observations),
    getFGTableConfig(observations),
    getMMTableConfig(observations),
    {
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
      id: 'observationvc',
      name: 'Observation VC',
      category: 'Vernier Caliper',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
        },
        remainingHeaders: ['Average', 'Error']
      },
      staticRows: createObservationRows(observations, 'observationvc').rows,
      hiddenInputs: createObservationRows(observations, 'observationvc').hiddenInputs
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
    getAPGTableConfig(observations),
    getITTableConfig(observations),
    getMTTableConfig(observations),
    getCTGTableConfig(observations),
    {
      id: 'observationutm',
      name: 'Observation UTM',
      category: 'Force',
      structure: {
        singleHeaders: [
          'Sr. No.',
          'Force (F)',
          'Std. at 23/24 +/-1 C',
          `Std. at Room Temp (°C)`,
        ],
        subHeaders: {
          'Observed (F)': ['Position 0° / Obs 1', 'Position 120° / Obs 2', 'Position 240° / Obs 3']
        },
        remainingHeaders: ['Mean (Fi)', 'Error (q)', '% Error (q)', '% Repeatability Error (q)']
      },
      staticRows: createObservationRows(observations, 'observationutm').rows,
      hiddenInputs: createObservationRows(observations, 'observationutm').hiddenInputs,
      rowMeta: createObservationRows(observations, 'observationutm').rowMeta,
      calibration_points: observations && Array.isArray(observations) && observations.length > 0
        ? observations[0]?.calibration_points || observations
        : [],
      metadata: (observations && Array.isArray(observations) && observations[0]?.metadata) || {},
      additional_data: (observations && Array.isArray(observations) && observations[0]?.additional_data) || {},
      zero_error_data: (observations && Array.isArray(observations) && observations[0]?.zero_error_data) || {},
    },
    {
      id: 'observationautm',
      name: 'Observation AUTM',
      category: 'Force',
      structure: null,
      calibration_points: observations && Array.isArray(observations) && observations.length > 0
        ? observations[0]?.calibration_points || observations
        : [],
      metadata: (observations && Array.isArray(observations) && observations[0]?.metadata) || {},
      additional_data: (observations && Array.isArray(observations) && observations[0]?.additional_data) || {},
      zero_error_data: (observations && Array.isArray(observations) && observations[0]?.zero_error_data) || {},
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
    {
      id: 'observationupload',
      name: 'Observation Upload',
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
    if (!structure.singleHeaders || !Array.isArray(structure.singleHeaders)) return null;

    const headers = [];
    const subHeadersRow = [];

    structure.singleHeaders.forEach((header) => {
      headers.push({ name: header, colspan: 1 });
      subHeadersRow.push(null);
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        headers.push({ name: groupName, colspan: Array.isArray(subHeaders) ? subHeaders.length : 1 });
        if (Array.isArray(subHeaders)) {
          subHeaders.forEach((subHeader) => {
            subHeadersRow.push(subHeader);
          });
        }
      });
    }

    if (structure.remainingHeaders && Array.isArray(structure.remainingHeaders) && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        headers.push({ name: header, colspan: 1 });
        subHeadersRow.push(null);
      });
    }

    return { headers, subHeadersRow };
  };

  const tableStructure = generateTableStructure();

  // UC observation least count as a string (keeps its decimal count), or null when
  // the matrix has none ("NA", "0", missing) so no LC check applies.
  const getUCObservationLc = (lcInfo) => {
    const lc = typeof lcInfo === 'object' ? lcInfo?.obs : lcInfo;
    if (lc == null || lc === '' || lc === 'NA') return null;
    const num = parseFloat(lc);
    return !isNaN(num) && num > 0 ? String(lc).trim() : null;
  };

  // ✅ CORRECTED: Complete least count validation with proper floating-point handling
  const validateLeastCount = (value, leastCount) => {
    if (value === '' || value === null || value === undefined) {
      return { isValid: true, error: null };
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || !leastCount || isNaN(parseFloat(leastCount))) {
      return { isValid: true, error: null };
    }

    const lcValue = parseFloat(leastCount);

    // 1 Check decimal places - must not exceed decimal places in least count
    const lcStr = String(leastCount).trim();
    const lcDecimals = lcStr.includes('.') ? lcStr.split('.')[1].length : 0;
    const valueStr = String(value).trim();
    const valueDecimals = valueStr.includes('.') ? valueStr.split('.')[1].length : 0;

    if (valueDecimals > lcDecimals) {
      return {
        isValid: false,
        error: `Maximum ${lcDecimals} decimal place(s) allowed for least count ${leastCount}`
      };
    }

    // 2️⃣ Check minimum value and divisibility - value must be >= least count and a multiple of least count (floating-point safe)
    if (numValue !== 0 && lcValue > 0) {
      if (!valueStr.endsWith('.')) {
        if (numValue < lcValue) {
          return {
            isValid: false,
            error: `Please enter a value with in leastcount ${leastCount}`
          };
        }

        if (!valueStr.includes('.') || valueDecimals >= lcDecimals) {
          const factor = 1000000;
          const scaledValue = Math.round(numValue * factor);
          const scaledLc = Math.round(lcValue * factor);
          const remainder = scaledValue % scaledLc;

          if (remainder !== 0) {
            return {
              isValid: false,
              error: `Please Enter Value divisible by ${leastCount}`
            };
          }
        }
      }
    }

    return { isValid: true, error: null };
  };

  const validateDecimalPlaces = (value, leastCount) => {
    const { isValid } = validateLeastCount(value, leastCount);
    return isValid;
  };

  const handleInputChange = (rowIndex, colIndex, value, fieldType = 'numeric') => {
    // Only allow digits, decimal point, and minus sign for numeric fields
    if (fieldType === 'numeric' && value !== '' && !/^-?\d*\.?\d*$/.test(value)) {
      return;
    }

    // Get calibration point ID for least count validation
    const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
    const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];

    // ✅ CORRECTED: Validate least count (both decimal places AND divisibility)
    if (value && value !== '.') {
      let leastCount = null;

      if (selectedTableData?.id === 'observationwb' || selectedTableData?.id === 'observationwbn') {
        leastCount = typeof lcInfo === 'object' ? (lcInfo?.uuc ?? lcInfo?.master ?? 0.001) : (parseFloat(lcInfo) || 0.001);
      } else if (selectedTableData?.id === 'observationts') {
        leastCount = typeof lcInfo === 'object' ? (lcInfo?.master ?? 0.01) : (parseFloat(lcInfo) || 0.01);
      } else if (selectedTableData?.id === 'observationmt') {
        // Handled in dedicated real-time validation block below
      } else if (selectedTableData?.id === 'observationvc' || selectedTableData?.id === 'observationfg' || selectedTableData?.id === 'observationctg' || selectedTableData?.id === 'observationit' || selectedTableData?.id === 'observationth') {
        leastCount = typeof lcInfo === 'object' ? (lcInfo?.master ?? lcInfo?.uuc ?? 0.001) : (parseFloat(lcInfo) || 0.001);
      } else if (selectedTableData?.id === 'observationmm') {
        leastCount = typeof lcInfo === 'object' ? (lcInfo?.master ?? lcInfo?.uuc ?? 2) : (parseFloat(lcInfo) || 2);
      } else if (selectedTableData?.id === 'observationuc') {
        // Only observation columns carry inleastcount/divisibleby in PHP; Range is free text
        leastCount = (colIndex >= 5 && colIndex <= 9) ? getUCObservationLc(lcInfo) : null;
      } else if (selectedTableData?.id === 'observationtswi') {
        // Only UUC readings carry inleastcount/divisibleby in PHP
        const tswiRowType = getTSWIRowType(selectedTableData.staticRows?.[rowIndex]);
        leastCount = getTSWIReadingLeastCount(tswiRowType, colIndex, selectedTableData.rowMeta?.[rowIndex]);
      } else if (selectedTableData?.id === 'observationsw') {
        // UUC readings use the UUC least count, master readings the master least count
        const swRowType = getSWRowType(selectedTableData.staticRows?.[rowIndex]);
        leastCount = getSWReadingLeastCount(swRowType, colIndex, selectedTableData.rowMeta?.[rowIndex]);
      } else if (lcInfo) {
        leastCount = typeof lcInfo === 'object' ? (lcInfo?.uuc ?? lcInfo?.master ?? 0.01) : (parseFloat(lcInfo) || 0.01);
      }

      if (selectedTableData?.id === 'observationmt' || selectedTableData?.id === 'observationfg' || selectedTableData?.id === 'observationmm' || selectedTableData?.id === 'observationctg') {
        // Handled in dedicated real-time validation block below
      } else if (leastCount) {
        const { isValid, error } = validateLeastCount(value, leastCount);
        const key = `${rowIndex}-${colIndex}`;
        if (!isValid) {
          setObservationErrors(prevErrors => ({
            ...prevErrors,
            [key]: error
          }));
        } else {
          setObservationErrors(prevErrors => {
            if (!prevErrors[key]) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });
        }
      }
    }

    setTableInputValues((prev) => {
      const newValues = { ...prev };
      const key = `${rowIndex}-${colIndex}`;
      newValues[key] = value;

      // Clear previous error on input change. Skipped for UC observation cells that were
      // just least-count validated above, otherwise this (queued later) wipes the new error.
      const ucLcHandled = selectedTableData.id === 'observationuc' && colIndex >= 5 && colIndex <= 9
        && value && value !== '.' && getUCObservationLc(lcInfo);
      const tswiLcHandled = selectedTableData.id === 'observationtswi' && value && value !== '.'
        && getTSWIReadingLeastCount(getTSWIRowType(selectedTableData.staticRows?.[rowIndex]), colIndex, selectedTableData.rowMeta?.[rowIndex]);
      const swLcHandled = selectedTableData.id === 'observationsw' && value && value !== '.'
        && getSWReadingLeastCount(getSWRowType(selectedTableData.staticRows?.[rowIndex]), colIndex, selectedTableData.rowMeta?.[rowIndex]);
      if (observationErrors[key] && !ucLcHandled && !tswiLcHandled && !swLcHandled) {
        setObservationErrors(prevErrors => {
          if (!prevErrors[key]) return prevErrors;
          const newErrors = { ...prevErrors };
          delete newErrors[key];
          return newErrors;
        });
      }

      // ✅ Real-time validation for observationfg (uses master least count)
      if (selectedTableData.id === 'observationfg' && colIndex >= 2 && colIndex <= 6) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];
        const point = observations?.[rowIndex];
        const masterLcVal = (typeof lcInfo === 'object' ? (lcInfo?.masterStr ?? lcInfo?.master ?? lcInfo?.uuc) : null)
          ?? point?.metadata?.master_least_count
          ?? point?.master_least_count
          ?? instrument?.masterleastcount
          ?? instrument?.leastcount
          ?? (parseFloat(lcInfo) || 0.001);
        const masterLc = typeof masterLcVal === 'string' ? parseFloat(masterLcVal) : (masterLcVal || 0.001);

        if (value.trim()) {
          const numValue = parseFloat(value);
          setObservationErrors(prevErrors => {
            if (!prevErrors[key]) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          if (isNaN(numValue)) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: 'Please enter a valid number'
            }));
          } else if (masterLc && !isNaN(masterLc) && masterLc > 0) {
            const masterLcStr = String(masterLc).trim();
            const decPlaces = masterLcStr.includes('.') ? masterLcStr.split('.')[1].length : 0;
            const valDecPlaces = value.includes('.') ? value.split('.')[1].length : 0;

            if (decPlaces > 0 && valDecPlaces > decPlaces) {
              setObservationErrors(prevErrors => ({
                ...prevErrors,
                [key]: `Maximum ${decPlaces} decimal place(s) allowed for least count ${masterLc}`
              }));
            } else if (numValue !== 0 && !value.endsWith('.')) {
              if (numValue < masterLc) {
                setObservationErrors(prevErrors => ({
                  ...prevErrors,
                  [key]: `Please enter a value with in leastcount ${masterLc}`
                }));
              } else {
                const factor = 1000000;
                const scaledVal = Math.round(numValue * factor);
                const scaledLc = Math.round(masterLc * factor);
                const remainder = scaledVal % scaledLc;
                if (remainder !== 0) {
                  setObservationErrors(prevErrors => ({
                    ...prevErrors,
                    [key]: `Please Enter Value divisible by ${masterLc}`
                  }));
                }
              }
            }
          }
        }
      }

      // ✅ NEW: Real-time validation for observationmm
      if (selectedTableData.id === 'observationmm' && colIndex >= 5 && colIndex <= 9) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId] || 2;

        if (value.trim()) {
          // Float modulo is unreliable (3 % 0.001 is 0.000999..., not 0), so use the
          // scaled-integer check shared with the other templates.
          const { isValid, error } = validateLeastCount(value.trim(), leastCount);
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            if (isValid) delete newErrors[key];
            else newErrors[key] = error;
            return newErrors;
          });
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

      // ✅ Real-time validation for observationcustom
      if (selectedTableData.id === 'observationcustom') {
        const layout = getCustomLayoutIndices(instrument);
        if (layout) {
          const isCheckCol = (
            colIndex === layout.paramIdx ||
            colIndex === layout.specIdx ||
            colIndex === layout.setpointIdx ||
            colIndex === layout.remarkIdx ||
            layout.masterObsIndices.includes(colIndex) ||
            layout.uucObsIndices.includes(colIndex)
          );

          const isObsCol = layout.masterObsIndices.includes(colIndex) || layout.uucObsIndices.includes(colIndex);

          if (isCheckCol) {
            if (!value.trim()) {
              setObservationErrors(prevErrors => ({
                ...prevErrors,
                [key]: 'This field is required'
              }));
            } else {
              setObservationErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[key];
                return newErrors;
              });

              const point = observations?.[rowIndex];
              let targetLc = undefined;
              if (layout.uucObsIndices.includes(colIndex)) {
                targetLc = point?.matrix?.leastcount ?? instrument?.leastcount;
              } else if (layout.masterObsIndices.includes(colIndex)) {
                targetLc = point?.master_matrix?.leastcount ?? instrument?.masterleastcount;
              }

              const leastCount = (targetLc && targetLc !== 'NA' && targetLc !== 'No' && !isNaN(parseFloat(targetLc)) && parseFloat(targetLc) > 0)
                ? parseFloat(targetLc)
                : undefined;

              if (leastCount && isObsCol) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue !== 0) {
                  if (numValue < leastCount) {
                    setObservationErrors(prevErrors => ({
                      ...prevErrors,
                      [key]: `Please enter a value with in leastcount ${leastCount}`
                    }));
                  } else {
                    const factor = 1000000;
                    const remainder = Math.round(numValue * factor) % Math.round(leastCount * factor);
                    if (remainder !== 0) {
                      setObservationErrors(prevErrors => ({
                        ...prevErrors,
                        [key]: `Please Enter Value divisible by ${leastCount}`
                      }));
                    }
                  }
                }
              }
            }
          }
        }
      }

      // ✅ Real-time validation for observationdpg
      if (selectedTableData.id === 'observationdpg' && colIndex >= 3 && colIndex <= 5) {
        const point = observations?.[rowIndex];
        const masterLcStr = point?.least_counts?.master || point?.master_least_count || point?.masterleastcount || instrument?.leastcount;
        const masterLc = masterLcStr ? parseFloat(masterLcStr) : undefined;

        if (!value.trim()) {
          setObservationErrors(prevErrors => ({
            ...prevErrors,
            [key]: 'This field is required'
          }));
        } else {
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          if (masterLc && !isNaN(masterLc) && masterLc > 0) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue !== 0) {
              if (numValue < masterLc) {
                setObservationErrors(prevErrors => ({
                  ...prevErrors,
                  [key]: `Please enter a value with in leastcount ${masterLc}`
                }));
              } else {
                const factor = 1000000;
                const remainder = Math.round(numValue * factor) % Math.round(masterLc * factor);
                if (remainder !== 0) {
                  setObservationErrors(prevErrors => ({
                    ...prevErrors,
                    [key]: `Please Enter Value divisible by ${masterLc}`
                  }));
                }
              }
            }
          }
        }
      }

      // ✅ Real-time validation for observationts
      if (selectedTableData.id === 'observationts' && colIndex >= 1 && colIndex <= 8) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const lcInfo = leastCountData[calibPointId];
        const masterLc = typeof lcInfo === 'object' ? (lcInfo?.master ?? 0.01) : (parseFloat(lcInfo) || 0.01);

        if (value.trim()) {
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: 'Please enter a valid number'
            }));
          } else if (masterLc && !isNaN(masterLc) && masterLc > 0) {
            const masterLcStr = (typeof lcInfo === 'object' && lcInfo?.masterLeastCountStr) ? lcInfo.masterLeastCountStr : masterLc.toString();
            const decPlaces = (masterLcStr.split('.')[1] || '').length;
            const valDecPlaces = (value.split('.')[1] || '').length;

            if (decPlaces > 0 && valDecPlaces > decPlaces) {
              setObservationErrors(prevErrors => ({
                ...prevErrors,
                [key]: `Please enter a value with in leastcount ${masterLc}`
              }));
            } else {
              const factor = 1000000;
              const remainder = Math.round(numValue * factor) % Math.round(masterLc * factor);
              if (remainder !== 0) {
                setObservationErrors(prevErrors => ({
                  ...prevErrors,
                  [key]: `Please Enter Value divisible by ${masterLc}`
                }));
              }
            }
          }
        }
      }

      // ✅ Real-time validation for observationmt
      if (selectedTableData.id === 'observationmt' && colIndex >= 2 && colIndex <= 6) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];
        const point = observations?.[rowIndex];
        const masterLc = (typeof lcInfo === 'object' ? (lcInfo?.masterStr ?? lcInfo?.master) : null) ?? point?.metadata?.master_least_count ?? point?.master_least_count ?? 0.005;

        if (value.trim()) {
          const numValue = parseFloat(value);
          const masterLcNum = parseFloat(masterLc);

          // Clear previous error
          setObservationErrors(prevErrors => {
            if (!prevErrors[key]) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          if (isNaN(numValue)) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: 'Please enter a valid number'
            }));
          } else if (masterLcNum && !isNaN(masterLcNum) && masterLcNum > 0) {
            const masterLcStr = String(masterLc).trim();
            const decPlaces = masterLcStr.includes('.') ? masterLcStr.split('.')[1].length : 0;
            const valDecPlaces = value.includes('.') ? value.split('.')[1].length : 0;

            if (decPlaces > 0 && valDecPlaces > decPlaces) {
              setObservationErrors(prevErrors => ({
                ...prevErrors,
                [key]: `Maximum ${decPlaces} decimal place(s) allowed for least count ${masterLc}`
              }));
            } else if (numValue !== 0 && !value.endsWith('.')) {
              if (numValue < masterLcNum) {
                setObservationErrors(prevErrors => ({
                  ...prevErrors,
                  [key]: `Please enter a value with in leastcount ${masterLc}`
                }));
              } else {
                const factor = 1000000;
                const scaledVal = Math.round(numValue * factor);
                const scaledLc = Math.round(masterLcNum * factor);
                const remainder = scaledVal % scaledLc;
                if (remainder !== 0) {
                  setObservationErrors(prevErrors => ({
                    ...prevErrors,
                    [key]: `Please Enter Value divisible by ${masterLc}`
                  }));
                }
              }
            }
          }
        }
      }

      // ✅ Real-time validation for observationwbn
      if (selectedTableData.id === 'observationwbn') {
        const point = observations?.[rowIndex];
        const weighingCount = selectedTableData?.weighingCount ?? (selectedTableData?.weighing_process?.rows?.length ?? 0);
        const repeatabilityCount = selectedTableData?.repeatabilityCount ?? (selectedTableData?.repeatability?.rows?.length ?? 0);

        let rowObj = null;
        let structuredKey = null;
        if (rowIndex < weighingCount) {
          rowObj = selectedTableData?.weighing_process?.rows?.[rowIndex];
          if (colIndex >= 2 && colIndex <= 4) {
            structuredKey = `wbn-w-${rowIndex}-${colIndex - 1}`;
          }
        } else if (rowIndex < weighingCount + repeatabilityCount) {
          const rIdx = rowIndex - weighingCount;
          rowObj = selectedTableData?.repeatability?.rows?.[rIdx];
          if (colIndex >= 1 && colIndex <= 5) {
            structuredKey = `wbn-r-${rIdx}-${colIndex}`;
          }
        } else {
          const eIdx = rowIndex - weighingCount - repeatabilityCount;
          rowObj = selectedTableData?.eccentricity?.rows?.[eIdx];
          if (colIndex >= 1 && colIndex <= 5) {
            structuredKey = `wbn-cw-${eIdx}-${colIndex}`;
          } else if (colIndex >= 6 && colIndex <= 10) {
            structuredKey = `wbn-acw-${eIdx}-${colIndex - 5}`;
          }
        }

        const lcStr = String(rowObj?.least_count_uuc ?? point?.least_count_uuc ?? point?.least_count ?? '0.010').trim();
        const lcNum = parseFloat(lcStr);
        const lcDec = (rowObj?.lc !== undefined && rowObj?.lc !== null && rowObj?.lc !== '' && rowObj?.lc !== 'NA')
          ? parseInt(rowObj.lc, 10)
          : (lcStr.includes('.') ? lcStr.split('.')[1].length : 3);

        if (value.trim()) {
          const numValue = parseFloat(value);
          const valDecPlaces = value.includes('.') ? value.split('.')[1].length : 0;

          // Clear previous error
          setObservationErrors(prevErrors => {
            if (!prevErrors[key] && (!structuredKey || !prevErrors[structuredKey])) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            if (structuredKey) delete newErrors[structuredKey];
            return newErrors;
          });

          if (isNaN(numValue)) {
            const errMsg = 'Please enter a valid number';
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: errMsg,
              ...(structuredKey ? { [structuredKey]: errMsg } : {})
            }));
          } else if (lcDec > 0 && valDecPlaces > lcDec) {
            const errMsg = `Maximum ${lcDec} decimal place(s) allowed for least count ${lcStr}`;
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: errMsg,
              ...(structuredKey ? { [structuredKey]: errMsg } : {})
            }));
          } else if (numValue !== 0 && !value.endsWith('.') && (!value.includes('.') || valDecPlaces >= lcDec) && lcNum > 0) {
            if (numValue < lcNum) {
              const errMsg = `Please enter a value with in leastcount ${lcStr}`;
              setObservationErrors(prevErrors => ({
                ...prevErrors,
                [key]: errMsg,
                ...(structuredKey ? { [structuredKey]: errMsg } : {})
              }));
            } else {
              const factor = 1000000;
              const scaledVal = Math.round(numValue * factor);
              const scaledLc = Math.round(lcNum * factor);
              if (scaledVal % scaledLc !== 0) {
                const errMsg = `Please Enter Value divisible by ${lcStr}`;
                setObservationErrors(prevErrors => ({
                  ...prevErrors,
                  [key]: errMsg,
                  ...(structuredKey ? { [structuredKey]: errMsg } : {})
                }));
              }
            }
          }
        } else {
          setObservationErrors(prevErrors => {
            if (!prevErrors[key] && (!structuredKey || !prevErrors[structuredKey])) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            if (structuredKey) delete newErrors[structuredKey];
            return newErrors;
          });
        }
      }

      if (!selectedTableData.staticRows?.[rowIndex]) return newValues;
      const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return newValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

      // Update calculated values in real-time
      if (selectedTableData.id === 'observationts') {
        newValues[`${rowIndex}-9`] = calculated.average || '';
      } else if (selectedTableData.id === 'observationmg') {
        newValues[`${rowIndex}-5`] = calculated.average;
        newValues[`${rowIndex}-6`] = calculated.error;
      } else if (selectedTableData.id === 'observationwbn') {
        const point = observations?.[rowIndex];
        const mode = point?.mode?.toLowerCase() || '';
        const weighingCount = selectedTableData?.weighingCount ?? (selectedTableData?.weighing_process?.rows?.length ?? 0);
        const repeatabilityCount = selectedTableData?.repeatabilityCount ?? (selectedTableData?.repeatability?.rows?.length ?? 0);

        if (mode.includes('weighing') || (weighingCount > 0 && rowIndex < weighingCount) || (!mode && rowIndex < weighingCount)) {
          if (calculated.weighingAverage !== undefined) {
            newValues[`${rowIndex}-5`] = calculated.weighingAverage;
            newValues[`wbn-avg-${rowIndex}`] = calculated.weighingAverage;
          }
          if (calculated.weighingError !== undefined) {
            newValues[`${rowIndex}-6`] = calculated.weighingError;
            newValues[`wbn-err-${rowIndex}`] = calculated.weighingError;
          }
        } else if (mode.includes('repeatability') || (repeatabilityCount > 0 && rowIndex < weighingCount + repeatabilityCount)) {
          if (calculated.repeatabilityAverage !== undefined) {
            newValues[`${rowIndex}-6`] = calculated.repeatabilityAverage;
            newValues[`wbn-r-avg-${rowIndex - weighingCount}`] = calculated.repeatabilityAverage;
          }
        } else if (mode.includes('eccentricity') || rowIndex >= weighingCount + repeatabilityCount) {
          if (calculated.eccentricity !== undefined) {
            newValues[`${rowIndex}-11`] = calculated.eccentricity;
            newValues[`wbn-ecc-${rowIndex - weighingCount - repeatabilityCount}`] = calculated.eccentricity;
          }
        }
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
        const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex] || selectedTableData?.calibrationPoints?.[rowIndex];
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
      else if (selectedTableData.id === 'observationtswoi') {
        // Averages, corrected averages and the deviation (on the UUC row) for this point
        applyTSWOICalculations(newValues, rowIndex);
      }
      else if (selectedTableData.id === 'observationtswi') {
        applyTSWICalculations(newValues, rowIndex);
      }
      else if (selectedTableData.id === 'observationsw') {
        if (isSWReadingColumn(colIndex)) applySWCalculations(newValues, rowIndex);
      }
      else if (selectedTableData.id === 'observationsutm') {
        if (isSUTMInputColumn(colIndex)) applySUTMCalculations(newValues, rowIndex);
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
      else if (selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationvc') {
        newValues[`${rowIndex}-7`] = calculated.average;
        newValues[`${rowIndex}-8`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationcustom') {
        const layout = getCustomLayoutIndices(instrument);
        if (layout) {
          if (layout.avgMasterIdx !== -1) newValues[`${rowIndex}-${layout.avgMasterIdx}`] = calculated.averagemaster || '';
          if (layout.avgUucIdx !== -1) newValues[`${rowIndex}-${layout.avgUucIdx}`] = calculated.averageuuc || '';
          if (layout.errorIdx !== -1) newValues[`${rowIndex}-${layout.errorIdx}`] = calculated.error || '';
        }
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

          const avgDiff = countDiff > 0 ? parseFloat((sumDiff / countDiff).toFixed(8)).toString() : '';

          // Apply this average diff to all rows of this calibration point
          selectedTableData.staticRows.forEach((r, rIdx) => {
            if (selectedTableData.hiddenInputs?.calibrationPoints?.[rIdx] === calibPointId) {
              newValues[`${rIdx}-9`] = avgDiff;
            }
          });
        }
      }

      else if (selectedTableData.id === 'observationgtm' || selectedTableData.id === 'observationpr') {
        // Real-time calculations and updates are cleanly managed inside ObservationGTM.jsx
        return newValues;
      }

      return newValues;
    });
  };

  const handleObservationBlur = async (rowIndex, colIndex, value, pointIdOverride, computed = null) => {
    const token = localStorage.getItem('authToken');
    const hiddenInputs = selectedTableData?.hiddenInputs || {
      calibrationPoints: [],
      types: [],
      repeatables: [],
      values: [],
    };

    let calibrationPointId = pointIdOverride;
    if (!calibrationPointId) {
      if (selectedTableData?.id === 'observationgtm') {
        const pointIndex = Math.floor(rowIndex / 2);
        const pointObj = observations?.[pointIndex] || selectedTableData?.calibration_points?.[pointIndex];
        calibrationPointId =
          pointObj?.point_id ||
          pointObj?.id ||
          pointObj?.calibration_point_id ||
          hiddenInputs?.calibrationPoints?.[rowIndex];
      }
      else if (selectedTableData.id === 'observationpr') {
        const pointObj = observations?.[0]?.points?.[rowIndex] || observations?.[rowIndex] || selectedTableData?.calibration_points?.[rowIndex];
        calibrationPointId =
          pointObj?.calib_point_id ||
          pointObj?.id ||
          pointObj?.calibration_point_id ||
          hiddenInputs?.calibrationPoints?.[rowIndex];
      }

      else {
        calibrationPointId =
          hiddenInputs?.calibrationPoints?.[rowIndex] ||
          observations?.[rowIndex]?.point_id ||
          observations?.[rowIndex]?.id ||
          selectedTableData?.calibration_points?.[rowIndex]?.point_id ||
          selectedTableData?.calibration_points?.[rowIndex]?.id;
      }
    }

    if (!calibrationPointId) {
      toast.error('Calibration point ID not found');
      return;
    }

    const staticRow = selectedTableData?.staticRows?.[rowIndex] || [];
    const colCount = Math.max(12, staticRow.length);
    const rowData = Array.from({ length: colCount }, (_, idx) => {
      if (idx === colIndex) return (value !== undefined && value !== null ? value.toString().trim() : '');
      const inputKey = `${rowIndex}-${idx}`;
      return tableInputValues[inputKey] ?? (staticRow[idx]?.toString() || '');
    });

    const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

    const payloads = [];

    if (selectedTableData.id === 'observationcustom') {
      const layout = getCustomLayoutIndices(instrument);
      if (layout) {
        let type = '';
        let repeatable = '0';

        if (colIndex === layout.paramIdx) {
          type = 'parameter';
        } else if (colIndex === layout.specIdx) {
          type = 'specification';
        } else if (colIndex === layout.setpointIdx) {
          if (getCustomInstrument().setpoint === 'Master') {
            type = 'master';
          } else if (getCustomInstrument().setpoint === 'UUC') {
            type = 'uuc';
          } else {
            type = 'setpoint';
          }
        } else if (layout.masterObsIndices.includes(colIndex)) {
          type = 'master';
          repeatable = layout.masterObsIndices.indexOf(colIndex).toString();
        } else if (layout.uucObsIndices.includes(colIndex)) {
          type = 'uuc';
          repeatable = layout.uucObsIndices.indexOf(colIndex).toString();
        } else if (colIndex === layout.remarkIdx) {
          type = 'remark';
        }

        const cellVal = value !== undefined && value !== null ? value.toString().trim() : '';
        if (type && cellVal !== '') {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: cellVal,
          });
        }

        // Also save calculated averages/errors if master, uuc, or setpoint observations changed
        if (layout.masterObsIndices.includes(colIndex) || layout.uucObsIndices.includes(colIndex) || colIndex === layout.setpointIdx) {
          if (layout.avgMasterIdx !== -1 && calculated.averagemaster) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averagemaster',
              repeatable: '0',
              value: calculated.averagemaster,
            });
          }
          if (layout.avgUucIdx !== -1 && calculated.averageuuc) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuuc',
              repeatable: '0',
              value: calculated.averageuuc,
            });
          }
          if (layout.errorIdx !== -1 && calculated.error) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: calculated.error,
            });
          }
        }

        setTableInputValues(prev => {
          const updated = { ...prev };
          if (layout.avgMasterIdx !== -1) updated[`${rowIndex}-${layout.avgMasterIdx}`] = calculated.averagemaster || '';
          if (layout.avgUucIdx !== -1) updated[`${rowIndex}-${layout.avgUucIdx}`] = calculated.averageuuc || '';
          if (layout.errorIdx !== -1) updated[`${rowIndex}-${layout.errorIdx}`] = calculated.error || '';
          return updated;
        });
      }
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
      setTableInputValues(prev => ({
        ...prev,
        [`${rowIndex}-9`]: calculated.average || ''
      }));
    } else if (selectedTableData.id === 'observationdpg') {
      const hasConvertedUuc = rowData[2] !== undefined && rowData[2] !== '' && rowData[2] !== null;
      if (hasConvertedUuc) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'calculateduuc',
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
      } else {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: '0',
          value: rowData[1] || '0',
        });
      }
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
    else if (selectedTableData.id === 'observationwbn') {
      const point = observations?.[rowIndex];
      const mode = point?.mode?.toLowerCase() || '';
      const weighingCount = selectedTableData?.weighingCount ?? 0;
      const repeatabilityCount = selectedTableData?.repeatabilityCount ?? 0;

      const isWeighing = mode.includes('weighing') || (weighingCount > 0 && rowIndex < weighingCount) || (!mode && rowIndex < weighingCount);
      const isRepeatability = mode.includes('repeatability') || (repeatabilityCount > 0 && rowIndex >= weighingCount && rowIndex < weighingCount + repeatabilityCount);
      const isEccentricity = mode.includes('eccentricity') || (rowIndex >= weighingCount + repeatabilityCount);

      if (isWeighing) {
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
          if (calculated.weighingAverage !== undefined && calculated.weighingAverage !== null && calculated.weighingAverage !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuuc',
              repeatable: '0',
              value: calculated.weighingAverage,
            });
          }
          if (calculated.weighingError !== undefined && calculated.weighingError !== null && calculated.weighingError !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: calculated.weighingError,
            });
          }

          // Update UI immediately for calculated values (without falling back to '0')
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-5`]: (calculated.weighingAverage !== undefined && calculated.weighingAverage !== null) ? calculated.weighingAverage : (prev[`${rowIndex}-5`] ?? ''),
            [`${rowIndex}-6`]: (calculated.weighingError !== undefined && calculated.weighingError !== null) ? calculated.weighingError : (prev[`${rowIndex}-6`] ?? ''),
            [`wbn-avg-${rowIndex}`]: (calculated.weighingAverage !== undefined && calculated.weighingAverage !== null) ? calculated.weighingAverage : (prev[`wbn-avg-${rowIndex}`] ?? ''),
            [`wbn-err-${rowIndex}`]: (calculated.weighingError !== undefined && calculated.weighingError !== null) ? calculated.weighingError : (prev[`wbn-err-${rowIndex}`] ?? ''),
          }));
        }
      } else if (isRepeatability) {
        if (colIndex >= 1 && colIndex <= 5) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'uucr',
            repeatable: (colIndex - 1).toString(),
            value: value || '0',
          });

          if (calculated.repeatabilityAverage !== undefined && calculated.repeatabilityAverage !== null && calculated.repeatabilityAverage !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuucr',
              repeatable: '0',
              value: calculated.repeatabilityAverage,
            });
          }

          // Update UI immediately for calculated values
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-6`]: (calculated.repeatabilityAverage !== undefined && calculated.repeatabilityAverage !== null) ? calculated.repeatabilityAverage : (prev[`${rowIndex}-6`] ?? ''),
            [`wbn-r-avg-${rowIndex - weighingCount}`]: (calculated.repeatabilityAverage !== undefined && calculated.repeatabilityAverage !== null) ? calculated.repeatabilityAverage : (prev[`wbn-r-avg-${rowIndex - weighingCount}`] ?? ''),
          }));
        } else {
          return;
        }
      } else if (isEccentricity) {
        if (colIndex >= 1 && colIndex <= 10) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'uuce',
            repeatable: (colIndex - 1).toString(),
            value: value || '0',
          });

          if (calculated.eccentricity !== undefined && calculated.eccentricity !== null && calculated.eccentricity !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'eccentricity',
              repeatable: '0',
              value: calculated.eccentricity,
            });
          }

          // Update UI immediately for calculated values
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-11`]: (calculated.eccentricity !== undefined && calculated.eccentricity !== null) ? calculated.eccentricity : (prev[`${rowIndex}-11`] ?? ''),
            [`wbn-ecc-${rowIndex - weighingCount - repeatabilityCount}`]: (calculated.eccentricity !== undefined && calculated.eccentricity !== null) ? calculated.eccentricity : (prev[`wbn-ecc-${rowIndex - weighingCount - repeatabilityCount}`] ?? ''),
          }));
        } else {
          return;
        }
      }

    } else if (selectedTableData.id === 'observationdg') {
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

      }
    }
    else if (selectedTableData.id === 'observationgtm') {
      const isUucRow = rowIndex % 2 === 0;
      let type = '';
      let repeatable = '0';

      if (isUucRow) {
        if (colIndex === 1) {
          type = 'setpoint';
          repeatable = '0';
        } else if (colIndex === 2) {
          type = 'range';
          repeatable = '0';
        } else if (colIndex >= 6 && colIndex <= 10) {
          type = 'uuc';
          repeatable = (colIndex - 6).toString();
        } else if (colIndex === 12) {
          type = 'averageuuc';
          repeatable = '0';
        } else if (colIndex === 13) {
          type = 'error';
          repeatable = '0';
        } else {
          return;
        }

        if (type) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: value ?? '',
          });
        }

        // If UUC readings changed, sync average and deviation if present
        if (colIndex >= 6 && colIndex <= 10) {
          const avgUuc = tableInputValues[`${rowIndex}-12`] ?? '';
          if (avgUuc !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuuc',
              repeatable: '0',
              value: avgUuc,
            });
          }

          const dev = tableInputValues[`${rowIndex}-13`] ?? '';
          if (dev !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: dev,
            });
          }
        }
      } else {
        // Master row
        if (colIndex === 4) {
          const selectedUnit = unitsList.find(u => u.label === value || u.value === value || u.unitDesc === value);
          type = 'masterunit';
          repeatable = '0';
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: selectedUnit?.value?.toString() || value || '0',
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
          type = 'caveragemaster';
          repeatable = '0';
        } else {
          return;
        }

        if (type) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: value ?? '',
          });
        }

        if (colIndex >= 6 && colIndex <= 10) {
          const avgMaster = tableInputValues[`${rowIndex}-11`] ?? '';
          if (avgMaster !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averagemaster',
              repeatable: '0',
              value: avgMaster,
            });
          }
        }

        if (colIndex === 12) {
          const uucRowIndex = rowIndex - 1;
          const uucPointIndex = Math.floor(uucRowIndex / 2);
          const uucCalibPointId =
            calibrationPointId ||
            observations?.[uucPointIndex]?.point_id ||
            observations?.[uucPointIndex]?.id ||
            selectedTableData.hiddenInputs?.calibrationPoints?.[uucRowIndex];
          const dev = tableInputValues[`${uucRowIndex}-13`] ?? '';
          if (uucCalibPointId && dev !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: uucCalibPointId,
              type: 'error',
              repeatable: '0',
              value: dev,
            });
          }
        }
      }

      // Send all payloads
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

        toast.success('Observation and calculated values saved successfully!');
        await refetchObservations();
      } catch (err) {
        console.error('❌ Error saving GTM observations:', err);
        toast.error(err.response?.data?.message || 'Failed to save GTM observations');
      }
      return;
    }
    else if (selectedTableData.id === 'observationpr') {

      let type = '';
      let repeatable = '0';

      // Column 1: Setpoint
      if (colIndex === 1) {
        type = 'setpoint';
        repeatable = '0';
      }
      // Columns 2, 3, 4: Master observations
      else if (colIndex >= 2 && colIndex <= 4) {
        type = 'master';
        repeatable = (colIndex - 2).toString();
      }
      // Column 5: Mean (averagemaster)
      else if (colIndex === 5) {
        type = 'averagemaster';
        repeatable = '0';
      }
      // Column 6: Repeatability
      else if (colIndex === 6) {
        type = 'repeatability';
        repeatable = '0';
      }
      // Column 7: Factor
      else if (colIndex === 7) {
        type = 'factor';
        repeatable = '0';
      }
      else {
        return;
      }

      if (type) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value ?? '',
        });
      }

      // When master observations change (columns 2, 3, 4), also save calculated values
      if (colIndex >= 2 && colIndex <= 4) {
        // PHP submits the whole form, so the readonly setpoint is persisted with every row.
        // Here the setpoint field is readonly and never blurs, so push it alongside.
        const setpointVal = rowData[1] ?? '';
        if (setpointVal !== '') {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'setpoint',
            repeatable: '0',
            value: setpointVal,
          });
        }

        const meanVal = tableInputValues[`${calibrationPointId}-averagemaster`] ?? tableInputValues[`averagemaster${calibrationPointId}`] ?? rowData[5] ?? '';
        const repVal = tableInputValues[`${calibrationPointId}-repeatability`] ?? tableInputValues[`repeatability${calibrationPointId}`] ?? rowData[6] ?? '';
        const factorVal = tableInputValues[`${calibrationPointId}-factor`] ?? tableInputValues[`factor${calibrationPointId}`] ?? rowData[7] ?? '';


        // Save Mean (averagemaster)
        if (meanVal !== '') {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'averagemaster',
            repeatable: '0',
            value: meanVal,
          });
        }

        // Save Repeatability
        if (repVal !== '') {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'repeatability',
            repeatable: '0',
            value: repVal,
          });
        }

        // Save Factor
        if (factorVal !== '') {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'factor',
            repeatable: '0',
            value: factorVal,
          });
        }
      }


      // Send all payloads
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

        toast.success('Observation and calculated values saved successfully!');
        await refetchObservations();
      } catch (err) {
        console.error('❌ Error saving PR observations:', err);
        toast.error(err.response?.data?.message || 'Failed to save PR observations');
      }
      return;
    }

    else if (selectedTableData.id === 'observationutm') {
      const rowMeta = selectedTableData.rowMeta?.[rowIndex];

      if (rowMeta?.kind === 'point') {
        // Setpoint (column 1) - force value
        if (colIndex === 1) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'setpoint',
            repeatable: '0',
            value: value || '0',
          });
        }
        // Calculated UUC (column 2) - at standard temperature
        else if (colIndex === 2) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'calculateduuc',
            repeatable: '0',
            value: value || '0',
          });
        }
        // UUC at room temperature (column 3) - with temperature compensation
        else if (colIndex === 3) {
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'uuc',
            repeatable: '0',
            value: value || '0',
          });
        }
        // Master observations (m0, m1, m2) - columns 4, 5, 6
        else if (colIndex >= 4 && colIndex <= 6) {
          const type = 'master';
          const repeatable = (colIndex - 4).toString();

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: value || '0',
          });

          // When master observations change, save calculated values
          const avgMaster = calculated.average || '0';
          const error = calculated.error || '0';
          const percentError = calculated.percentError || '0';
          const repeatability = calculated.repeatability || '0';

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'averagemaster',
            repeatable: '0',
            value: avgMaster,
          });

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'error',
            repeatable: '0',
            value: error,
          });

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'percenterror',
            repeatable: '0',
            value: percentError,
          });

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'repeatability',
            repeatable: '0',
            value: repeatability,
          });

          // Update UI immediately
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-7`]: avgMaster,
            [`${rowIndex}-8`]: error,
            [`${rowIndex}-9`]: percentError,
            [`${rowIndex}-10`]: repeatability,
          }));
        }
      } else if (rowMeta?.kind === 'removal') {
        // Removal force observations - columns 4, 5, 6
        // According to PHP, removal force uses MATRIX ID as calibration point
        if (colIndex >= 4 && colIndex <= 6) {
          const type = 'removalforce';
          const repeatable = (colIndex - 4).toString();
          const matrixId = rowMeta.matrixId; // Use matrix ID, not point ID

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: matrixId,
            type: type,
            repeatable: repeatable,
            value: value || '0',
          });

          // Calculate and save zero error
          const maxPoint = parseFloat(rowMeta.maxPoint) || 0;
          const removal = parseFloat(value) || 0;
          const zeroErr = maxPoint && removal ? ((removal / maxPoint) * 100).toFixed(2) : '0';

          // Find the zero error row for this matrix
          const zeroRowIndex = selectedTableData.rowMeta?.findIndex(
            (meta) => meta.kind === 'zeroerror' && meta.matrixId === rowMeta.matrixId
          );

          if (zeroRowIndex >= 0) {
            // Zero error also uses matrix ID
            const zeroPointId = rowMeta.matrixId;

            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: zeroPointId,
              type: 'zeroerror',
              repeatable: (colIndex - 4).toString(),
              value: zeroErr,
            });

            // Update UI immediately
            setTableInputValues(prev => ({
              ...prev,
              [`${zeroRowIndex}-${colIndex}`]: zeroErr,
            }));
          }
        }
      } else if (rowMeta?.kind === 'zeroerror') {
        // Zero error can be manually edited
        // According to PHP, zero error uses MATRIX ID as calibration point
        const type = 'zeroerror';
        const repeatable = (colIndex - 4).toString();
        const matrixId = rowMeta.matrixId; // Use matrix ID, not point ID

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: matrixId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });
      } else if (rowMeta?.kind === 'machine') {
        // Class of Machine / Dial Gauge Setting row
        // According to PHP, these fields use MATRIX ID as calibration point
        let type = '';

        if (colIndex === 1) {
          type = 'classofmachine';
        } else if (colIndex === 5) {
          type = 'dialguageseting';
        }

        if (type) {
          const matrixId = rowMeta.matrixId; // Use matrix ID, not point ID
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: matrixId,
            type: type,
            repeatable: '0',
            value: value || '',
          });
        }
      }
    }
    else if (selectedTableData.id === 'observationautm') {
      let type = '';
      let repeatable = '0';
      let targetPointId = calibrationPointId;

      // Matrix-level fields first: their column indexes must not collide with the
      // 4..7 observation range (dial gauge used to be 5 and was saved as removalforce).
      if (colIndex === 1) {
        type = 'classofmachine';
      } else if (colIndex === 9) {
        type = 'dialguageseting';
      } else if (colIndex === 10) {
        type = 'ratio';
        if (computed?.relativeRes !== undefined && computed.relativeRes !== '') {
          payloads.push({
            inwardid: inwardId, instid: instId, calibrationpoint: targetPointId,
            type: 'releativeres', repeatable: '0', value: computed.relativeRes,
          });
        }
      } else if (colIndex >= 4 && colIndex <= 7) {
        // Check if the passed ID is a calibration point ID (observations is an array of matrices for AUTM)
        const isPoint = targetPointId.toString().startsWith('pt-') ||
          observations.some(matrix => {
            const points = matrix.calibration_points || matrix.rows || [];
            return points.some((p, index) =>
              String(p.id) === String(targetPointId) ||
              String(p.point_id) === String(targetPointId) ||
              String(p.calibration_point_id) === String(targetPointId) ||
              String(p.calibrationpoint) === String(targetPointId) ||
              `pt-${index}` === String(targetPointId)
            );
          }) ||
          (selectedTableData?.calibration_points && selectedTableData.calibration_points.some(p =>
            String(p.id) === String(targetPointId) ||
            String(p.point_id) === String(targetPointId) ||
            String(p.calibration_point_id) === String(targetPointId)
          ));

        if (isPoint) {
          type = 'master';
          repeatable = (colIndex - 4).toString();

          // The component already computes these exactly as the PHP does
          // (error = uuc - averagemaster, %error = error/averagemaster*100,
          //  repeatability = (max-min)/averagemaster*100). Persist those values so
          // what is stored always matches what is displayed.
          const push = (t, v) => {
            if (v === undefined || v === null || v === '') return;
            payloads.push({
              inwardid: inwardId, instid: instId, calibrationpoint: targetPointId,
              type: t, repeatable: '0', value: v.toString(),
            });
          };

          push('averagemaster', computed?.avgMaster);
          push('error', computed?.error);
          push('percenterror', computed?.percentError);
          push('repeatability', computed?.repeatability);
          // PHP submits these three per point as well.
          push('setpoint', computed?.setpoint);
          push('calculateduuc', computed?.calculatedUuc);
          push('uuc', computed?.uuc);

        } else {
          // If it's not a point, it's the matrixId used for removal force
          type = 'removalforce';
          repeatable = (colIndex - 4).toString();

          const matrix = observations.find(m =>
            String(m.id) === String(targetPointId) ||
            String(m.matrix_id) === String(targetPointId) ||
            String(m.matrixid) === String(targetPointId)
          );

          // Prefer the value the component displays; the local recalculation below
          // can resolve maxPoint to 0 and store zeroerror as "0".
          if (computed?.zeroError !== undefined && computed.zeroError !== '') {
            payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: targetPointId, type: 'zeroerror', repeatable: (colIndex - 4).toString(), value: computed.zeroError });
          } else if (matrix) {
            const pts = matrix.calibration_points || matrix.rows || [];
            const numPts = pts.map(p => parseFloat(p.point ?? p.setpoint)).filter(n => !isNaN(n));
            const maxPoint = numPts.length ? Math.max(...numPts) : 0;
            const removal = parseFloat(value || 0);
            const zeroErr = maxPoint && removal ? ((removal / maxPoint) * 100).toFixed(2) : '0';

            payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: targetPointId, type: 'zeroerror', repeatable: (colIndex - 4).toString(), value: zeroErr });
          }
        }
      }

      if (type) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: targetPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });
      }
    }

    else if (selectedTableData.id === 'observationsutm') {
      const field = getSUTMFieldType(colIndex);
      if (!field || !isSUTMCellEditable(colIndex)) return;

      const cellValue = value !== undefined && value !== null ? value.toString().trim() : '';
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: field.type,
        repeatable: field.repeatable,
        value: cellValue,
      });

      // Displacement/time change the set speeds, the mean speed and the error
      const values = { ...tableInputValues, [`${rowIndex}-${colIndex}`]: cellValue };
      const cells = applySUTMCalculations(values, rowIndex);
      Object.entries(cells).forEach(([col, calcValue]) => {
        const calcField = getSUTMFieldType(Number(col));
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: calcField.type,
          repeatable: calcField.repeatable,
          value: calcValue,
        });
      });

      setTableInputValues(prev => {
        const next = { ...prev };
        Object.entries(cells).forEach(([col, calcValue]) => {
          next[`${rowIndex}-${col}`] = calcValue;
        });
        return next;
      });
    }
    else if (selectedTableData.id === 'observationsw') {
      const rowType = getSWRowType(rowData);
      const field = getSWFieldType(rowType, colIndex);
      if (!field || !isSWCellEditable(rowType, colIndex)) return;

      const cellValue = value !== undefined && value !== null ? value.toString().trim() : '';
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: field.type,
        repeatable: field.repeatable,
        value: cellValue,
      });

      // A reading changes this row's average and the error; hand-edited
      // averages, error and uncertainty are saved as typed
      if (isSWReadingColumn(colIndex)) {
        const values = { ...tableInputValues, [`${rowIndex}-${colIndex}`]: cellValue };
        const { uucIndex } = applySWCalculations(values, rowIndex);
        const calcCells = [[rowIndex, SW_COLS.AVERAGE], [uucIndex, SW_COLS.ERROR]];

        calcCells.forEach(([calcRow, calcCol]) => {
          const calcField = getSWFieldType(calcRow === uucIndex ? 'uuc' : 'master', calcCol);
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: calcField.type,
            repeatable: calcField.repeatable,
            value: values[`${calcRow}-${calcCol}`],
          });
        });

        setTableInputValues(prev => {
          const next = { ...prev };
          calcCells.forEach(([calcRow, calcCol]) => {
            next[`${calcRow}-${calcCol}`] = values[`${calcRow}-${calcCol}`];
          });
          return next;
        });
      }
    }
    else if (selectedTableData.id === 'observationtswi') {
      const rowType = getTSWIRowType(rowData);
      const field = getTSWIFieldType(rowType, colIndex);
      if (!field || !isTSWICellEditable(rowType, colIndex)) return;

      const cellValue = value !== undefined && value !== null ? value.toString().trim() : '';
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: field.type,
        repeatable: field.repeatable,
        value: cellValue,
      });

      // UUC readings -> averageuuc and the deviation; master readings / ambient mV ->
      // averagemaster and saveragemaster; master Average (unit) -> the deviation
      const isReading = colIndex >= TSWI_COLS.OBS_START && colIndex <= TSWI_COLS.OBS_END;
      const values = { ...tableInputValues, [`${rowIndex}-${colIndex}`]: cellValue };
      const { uucIndex, masterIndex } = applyTSWICalculations(values, rowIndex);
      const calcCells = [];
      if (rowType === 'uuc' && isReading) {
        calcCells.push([uucIndex, TSWI_COLS.CONVERTED_AVERAGE], [uucIndex, TSWI_COLS.DEVIATION]);
      }
      if (rowType === 'master' && (isReading || colIndex === TSWI_COLS.AMBIENT)) {
        calcCells.push([masterIndex, TSWI_COLS.AVERAGE], [masterIndex, TSWI_COLS.CORRECTED_AVERAGE]);
      }
      if (rowType === 'master' && colIndex === TSWI_COLS.CONVERTED_AVERAGE) {
        calcCells.push([uucIndex, TSWI_COLS.DEVIATION]);
      }

      calcCells.forEach(([calcRow, calcCol]) => {
        const calcField = getTSWIFieldType(calcRow === uucIndex ? 'uuc' : 'master', calcCol);
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: calcField.type,
          repeatable: calcField.repeatable,
          value: values[`${calcRow}-${calcCol}`],
        });
      });

      if (calcCells.length) {
        setTableInputValues(prev => {
          const next = { ...prev };
          calcCells.forEach(([calcRow, calcCol]) => {
            next[`${calcRow}-${calcCol}`] = values[`${calcRow}-${calcCol}`];
          });
          return next;
        });
      }
    }
    else if (selectedTableData.id === 'observationtswoi') {
      const rowType = getTSWOIRowType(rowData);
      const field = getTSWOIFieldType(rowType, colIndex);
      if (!field || !isTSWOICellEditable(rowType, colIndex)) return;

      const cellValue = value !== undefined && value !== null ? value.toString().trim() : '';
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: field.type,
        repeatable: field.repeatable,
        value: cellValue,
      });

      // Readings and ambient mV change this row's average and corrected average;
      // Average (unit) changes the deviation, which is stored on the UUC row
      const isReading = colIndex >= TSWOI_COLS.OBS_START && colIndex <= TSWOI_COLS.OBS_END;
      const values = { ...tableInputValues, [`${rowIndex}-${colIndex}`]: cellValue };
      const { uucIndex } = applyTSWOICalculations(values, rowIndex);
      const calcCells = [];
      if (isReading || colIndex === TSWOI_COLS.AMBIENT) {
        calcCells.push([rowIndex, TSWOI_COLS.AVERAGE], [rowIndex, TSWOI_COLS.CORRECTED_AVERAGE]);
      }
      if (colIndex === TSWOI_COLS.CONVERTED_AVERAGE) {
        calcCells.push([uucIndex, TSWOI_COLS.DEVIATION]);
      }

      calcCells.forEach(([calcRow, calcCol]) => {
        const calcField = getTSWOIFieldType(calcRow === uucIndex ? 'uuc' : 'master', calcCol);
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: calcField.type,
          repeatable: calcField.repeatable,
          value: values[`${calcRow}-${calcCol}`],
        });
      });

      if (calcCells.length) {
        setTableInputValues(prev => {
          const next = { ...prev };
          calcCells.forEach(([calcRow, calcCol]) => {
            next[`${calcRow}-${calcCol}`] = values[`${calcRow}-${calcCol}`];
          });
          return next;
        });
      }
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
    } else if (selectedTableData.id === 'observationvht') {
      const obsEnd = VHT_COLUMNS.observationStart + VHT_MAX_REPEATABLE - 1;

      if (colIndex >= VHT_COLUMNS.observationStart && colIndex <= obsEnd) {
        const repeatable = (colIndex - VHT_COLUMNS.observationStart).toString();

        const pushVht = (type, val, rep = '0') => {
          if (val === undefined || val === null || val === '') return;
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type,
            repeatable: rep,
            value: val.toString(),
          });
        };

        pushVht('cuuc', value || '0', repeatable);
        // The converted reading belongs to the same repeatable slot.
        pushVht('uuc', computed?.convertedReading, repeatable);

        // The component computes these from the values on screen; persist them so
        // the stored copy always matches what the operator sees.
        pushVht('caverageuuc', computed?.caverageuuc);
        pushVht('averageuuc', computed?.averageuuc);
        pushVht('error', computed?.error);
        pushVht('percenterror', computed?.percentError);
        // PHP posts the Nominal/Set Value too, which is how a point with no
        // stored master row gets one (it falls back to the calibration point).
        pushVht('master', computed?.master);
      } else {
        return;
      }
    } else if (selectedTableData.id === 'observationvol') {
      const masterEnd = VOL_COLUMNS.masterStart + VOL_MAX_REPEATABLE - 1;

      const pushVol = (type, val, repeatable = '0') => {
        if (val === undefined || val === null || val === '') return;
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type,
          repeatable,
          value: val.toString(),
        });
      };

      if (colIndex >= VOL_COLUMNS.masterStart && colIndex <= masterEnd) {
        pushVol('master', value || '0', (colIndex - VOL_COLUMNS.masterStart).toString());
        // The component computes these from the values on screen; persist them so
        // the stored copy always matches what the operator sees.
        pushVol('averagemaster', computed?.average);
        pushVol('caveragemaster', computed?.convertedAverage);
        pushVol('error', computed?.error);
        pushVol('zvalue', computed?.zValue);
      } else if (colIndex === VOL_COLUMNS.specification) {
        pushVol('specification', value || '');
      } else if (colIndex === VOL_COLUMNS.remark) {
        pushVol('remark', value || '');
      } else {
        return;
      }
    } else if (selectedTableData.id === 'observationvolnl') {
      const masterEnd = VOLNL_COLUMNS.masterStart + VOLNL_MAX_REPEATABLE - 1;

      if (colIndex >= VOLNL_COLUMNS.masterStart && colIndex <= masterEnd) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: (colIndex - VOLNL_COLUMNS.masterStart).toString(),
          value: value || '0',
        });

        // The component computes these from the values on screen; persist them so
        // the stored copy always matches what the operator sees.
        const push = (type, val) => {
          if (val === undefined || val === null || val === '') return;
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type,
            repeatable: '0',
            value: val.toString(),
          });
        };

        push('averagemaster', computed?.average);
        push('caveragemaster', computed?.convertedVolume);
        push('volumeat', computed?.volumeAt);
        push('error', computed?.error);
        push('zvalue', computed?.zValue);
      } else {
        return;
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
          repeatable = (colIndex - 5).toString();
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
          repeatable = (colIndex - 5).toString();
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

        // Update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }

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
    } else if (selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationvc') {
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

      const point = observations?.[rowIndex];
      const lcInfo = leastCountData[calibrationPointId] || leastCountData[String(calibrationPointId)];
      const masterLc = (typeof lcInfo === 'object' ? (lcInfo?.masterStr ?? lcInfo?.master) : null) ?? point?.metadata?.master_least_count ?? point?.master_least_count ?? 0.005;
      const uucLc = (typeof lcInfo === 'object' ? (lcInfo?.uucStr ?? lcInfo?.uuc) : null) ?? point?.metadata?.least_count ?? point?.least_count ?? 1;

      if (colIndex === 1) {
        type = 'uuc';
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= 6) {
        const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex] || point?.metadata?.repeatable_cycle, 10) || 5;
        if (colIndex >= 2 + repeatableCycle) return;
        type = 'master';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      // Check least count validation on blur
      const key = `${rowIndex}-${colIndex}`;
      const lcToValidate = colIndex === 1 ? uucLc : masterLc;
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        const numVal = parseFloat(value);
        const lcNum = parseFloat(lcToValidate);
        const lcStr = String(lcToValidate).trim();
        const decPlaces = lcStr.includes('.') ? lcStr.split('.')[1].length : 0;
        const valDecPlaces = String(value).includes('.') ? String(value).split('.')[1].length : 0;

        let blurError = null;
        if (isNaN(numVal)) {
          blurError = 'Please enter a valid number';
        } else if (decPlaces > 0 && valDecPlaces > decPlaces) {
          blurError = `Maximum ${decPlaces} decimal place(s) allowed for least count ${lcToValidate}`;
        } else if (numVal !== 0 && lcNum > 0) {
          if (numVal < lcNum) {
            blurError = `Please enter a value with in leastcount ${lcToValidate}`;
          } else {
            const factor = 1000000;
            const remainder = Math.round(numVal * factor) % Math.round(lcNum * factor);
            if (remainder !== 0) {
              blurError = `Please Enter Value divisible by ${lcToValidate}`;
            }
          }
        }

        if (blurError) {
          setObservationErrors(prev => ({
            ...prev,
            [key]: blurError
          }));
          return;
        } else {
          setObservationErrors(prev => {
            if (!prev[key]) return prev;
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }
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
        const updatedRowData = [...rowData];
        updatedRowData[colIndex] = value;
        const updatedCalculated = calculateRowValues(updatedRowData, selectedTableData.id, rowIndex);

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
          repeatable: '0',
          value: updatedCalculated.average || '0',
        });
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'error',
          repeatable: '0',
          value: updatedCalculated.error || '0',
        });

        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: updatedCalculated.average || '',
          [`${rowIndex}-8`]: updatedCalculated.error || ''
        }));
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
          if (calculated.average !== undefined && calculated.average !== null && calculated.average !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averageuuc',
              repeatable: '0',
              value: calculated.average,
            });
          }
          if (calculated.error !== undefined && calculated.error !== null && calculated.error !== '') {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: calculated.error,
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

        const avgDiff = countDiff > 0 ? parseFloat((sumDiff / countDiff).toFixed(8)).toString() : '0';

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

    const validPayloads = payloads.filter(p => p && p.value !== undefined && p.value !== null && p.value.toString().trim() !== '');
    if (validPayloads.length === 0) return;


    try {
      for (const payload of validPayloads) {
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

      toast.success(`Observation and calculated values saved successfully!`);

      await refetchObservations();
    } catch (err) {
      console.error(`Error saving observation [${rowIndex}, ${colIndex}]:`, err);
      toast.error(err.response?.data?.message || 'Failed to save observation');
    }
  };


  const handleThermalCoeffBlur = async (type, value) => {
    if (selectedTableData?.id !== 'observationctg' &&
      selectedTableData?.id !== 'observationit' &&
      selectedTableData?.id !== 'observationmt' &&
      selectedTableData?.id !== 'observationfg' &&
      selectedTableData?.id !== 'observationhg' &&
      selectedTableData?.id !== 'observationexm' &&
      selectedTableData?.id !== 'observationvc' &&
      selectedTableData?.id !== 'observationdg' &&
      selectedTableData?.id !== 'observationts' &&
      selectedTableData?.id !== 'observationmsr') return;

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

      toast.success(`Thermal coefficient saved successfully!`);
    } catch (err) {
      console.error(`❌ Error saving thermal coefficient (${type}):`, err);
      toast.error(err.response?.data?.message || 'Failed to save thermal coefficient');
    }
  };

  const handleParallelismBlur = async (type, value) => {
    if (selectedTableData?.id !== 'observationvc') return;

    const token = localStorage.getItem('authToken');
    const calibrationPointId = instId;

    if (!calibrationPointId) {
      toast.error('Instrument ID not found for parallelism');
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

      toast.success(`Parallelism saved successfully!`);
    } catch (err) {
      console.error(`❌ Error saving parallelism (${type}):`, err);
      toast.error(err.response?.data?.message || 'Failed to save parallelism');
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

      if (isSuccess && (response.data.data || response.data.calibration_points)) {
        const observationData = response.data.data;

        // ✅ ADD OBSERVATIONAVG CASE HERE
        if (observationTemplate === 'observationavg') {

          const avgData = observationData.data || observationData;

          if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
            setObservations(avgData.calibration_point);
          } else {
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmg') {

          const mgData = observationData.data || observationData;

          if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
            setObservations(mgData.calibration_points);
          } else if (mgData.observations && Array.isArray(mgData.observations)) {
            setObservations(mgData.observations);
          } else {
            setObservations([]);
          }
        } else if (observationTemplate === 'observationmsr') {

          if (Array.isArray(observationData) && observationData.length > 0) {
            const msrData = observationData[0];

            if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
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
          }
        }
        else if (observationTemplate === 'observationdg') {

          // DG returns observations array directly at root level
          if (observationData.observations && Array.isArray(observationData.observations)) {
            setObservations(observationData.observations);
          } else if (Array.isArray(observationData)) {
            // Fallback if data is directly an array
            setObservations(observationData);
          } else {
            setObservations([]);
          }

          // Handle thermal coefficients for DG
          if (observationData.thermal_coefficients) {
            setThermalCoeff({
              uuc: observationData.thermal_coefficients.uuc || '',
              master: observationData.thermal_coefficients.master || '',
              thickness_of_graduation: '' // DG doesn't use this field
            });
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
          setObservations(observationData.observations);
        }

        else if (observationTemplate === 'observationgtm') {

          const gtmPoints = observationData.calibration_points || observationData.data?.calibration_points || (Array.isArray(observationData.data) ? observationData.data : null);
          if (gtmPoints && Array.isArray(gtmPoints)) {
            setObservations(gtmPoints);
          }
        }
        else if (observationTemplate === 'observationrtdwi') {

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            setObservations(observationData.calibration_points);
          } else if (observationData.calibration_data && Array.isArray(observationData.calibration_data)) {
            setObservations(observationData.calibration_data);
          } else if (observationData.data && observationData.data.calibration_points) {
            setObservations(observationData.data.calibration_points);
          } else {
            // DON'T clear observations - keep existing data to prevent table disappearing
          }
        }
        else if (observationTemplate === 'observationtswoi') {
          // Keep existing data when the response has no points, as RTDWI does
          const tswoiPoints = extractTSWOIPoints(observationData);
          if (tswoiPoints) setObservations(tswoiPoints);
        }
        else if (observationTemplate === 'observationtswi') {
          // Keep existing data when the response has no points, as RTDWI does
          const tswiPoints = extractTSWIPoints(observationData);
          if (tswiPoints) setObservations(tswiPoints);
        }
        else if (observationTemplate === 'observationsw') {
          // Keep existing data when the response has no points, as RTDWI does
          const swPoints = extractSWPoints(observationData);
          if (swPoints) setObservations(swPoints);
        }
        else if (observationTemplate === 'observationsutm') {
          // Keep existing data when the response has no points, as RTDWI does
          const sutmPoints = extractSUTMPoints(observationData);
          if (sutmPoints) setObservations(sutmPoints);
        }
        else if (observationTemplate === 'observationfg') {

          const fgData = observationData.data || observationData;

          // Check both possible structures
          if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
            setObservations(fgData.calibration_points);

            if (fgData.thermal_coefficients) {
              setThermalCoeff({
                uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
                master: fgData.thermal_coefficients.thermal_coeff_master || '',
                thickness_of_graduation: ''
              });
            }
          } else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
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
        }
        else if (observationTemplate === 'observationpr') {

          const prData = observationData?.data || observationData;
          const matrices = prData?.matrices || observationData?.matrices || [];

          if (Array.isArray(matrices) && matrices.length > 0) {
            setObservations(matrices);
          } else if (Array.isArray(prData?.points)) {
            setObservations([{ matrix_id: 'default', points: prData.points }]);
          } else if (Array.isArray(prData)) {
            setObservations(prData);
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

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            setObservations(observationData.calibration_points);
            seedTableInputsFromPoints(observationData.calibration_points);

            // Handle thermal coefficients and additional measurements
            const addl = response.data.additional_measurements || observationData?.additional_measurements || {};
            setThermalCoeff({
              uuc: observationData.thermal_coefficients?.uuc || '',
              master: observationData.thermal_coefficients?.master || '',
              thickness_of_graduation: '', // EXM doesn't use this field
              parallinternal: addl.parallelism_spindle_anvil?.value ?? addl.parallinternal?.value ?? ''
            });
          } else {
            setObservations([]);
          }
        } else if (observationTemplate === 'observationvc') {
          let vcPoints = response.data.calibration_points || observationData?.calibration_points;
          if (!vcPoints && observationData?.matrix_groups && Array.isArray(observationData.matrix_groups)) {
            vcPoints = observationData.matrix_groups.flatMap(g => g.points || []);
          }
          if (!vcPoints && Array.isArray(observationData)) {
            vcPoints = observationData;
          }
          if (!vcPoints) vcPoints = [];

          if (Array.isArray(vcPoints) && vcPoints.length > 0) {
            setObservations(vcPoints);
            seedTableInputsFromPoints(vcPoints);
          } else {
            setObservations([]);
          }

          const thermal = response.data.thermal_coefficients || observationData?.thermal_coefficients;
          if (thermal) {
            setThermalCoeff({
              uuc: thermal.uuc || '',
              master: thermal.master || '',
              thickness_of_graduation: ''
            });
          }

          const addl = response.data.additional_measurements || observationData?.additional_measurements || {};
          setParallelism({
            parallinternal: addl.parallelism_spindle_anvil?.value ?? addl.parallelism_internal?.value ?? addl.parallinternal ?? addl.internal ?? response.data.parallinternal ?? '',
            parallexternal: addl.parallelism_external?.value ?? addl.parallexternal ?? addl.external ?? response.data.parallexternal ?? '',
          });
        } else if (observationTemplate === 'observationhg') {

          // HG has calibration_points in the second object of the array
          const hgData = observationData[1] || observationData;

          if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
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
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmt') {
          const mtData = observationData.data || observationData;

          if (mtData.calibration_points) {
            setObservations(mtData.calibration_points);

            const leastCountMap = {};
            mtData.calibration_points.forEach((point) => {
              const calibPointId = point.point_id?.toString() || point.calibration_point_id?.toString() || point.id?.toString();
              if (calibPointId) {
                const uucLc = point.metadata?.least_count ?? point.least_count ?? point.leastcount ?? 1;
                const masterLc = point.metadata?.master_least_count ?? point.master_least_count ?? point.masterleastcount ?? 0.005;
                leastCountMap[calibPointId] = {
                  uuc: parseFloat(uucLc),
                  master: parseFloat(masterLc),
                  uucStr: String(uucLc),
                  masterStr: String(masterLc),
                  decimals: point.metadata?.decimal_places,
                  master_decimals: point.metadata?.master_decimal_places,
                  repeatable_cycle: point.metadata?.repeatable_cycle,
                };
              }
            });
            setLeastCountData(prev => ({ ...prev, ...leastCountMap }));

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

          const dwData = Array.isArray(observationData) ? observationData : observationData.data || observationData.calibration_points;
          const env = response.data?.environment || observationData.environment;

          if (env) {
            const envPressureStart = env.pressure_start || env.pressurestart || '';
            const envPressureEnd = env.pressure_end || env.pressureend || '';
            const envStabilizationTime = env.stabilization_time || env.stabilizationtime || '';


            setFormData(prev => ({
              ...prev,
              pressurestart: envPressureStart || '',
              pressureend: envPressureEnd || '',
              stabilizationtime: envStabilizationTime || '',
            }));

            setTableInputValues(prev => ({
              ...prev,
              [`${instId}-pressure-start`]: envPressureStart,
              [`${instId}-pressure-end`]: envPressureEnd,
              [`${instId}-stabilization`]: envStabilizationTime,
            }));

          }

          if (Array.isArray(dwData) && dwData.length > 0) {
            setObservations(dwData);
          } else {
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationtm') {
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
        else if (observationTemplate === 'observationcustom') {
          if (observationData.instrument_settings) {
            setCustomSettings(observationData.instrument_settings);
            setInstrument(prev => ({ ...prev, ...observationData.instrument_settings }));
          }
          const points = observationData.calibration_points || observationData.points || observationData.data || (Array.isArray(observationData) ? observationData : []);
          setObservations(Array.isArray(points) ? points : []);
        }
        else if (observationTemplate === 'observationts') {
          const uucCoeff = observationData.thermal_coefficient_uuc ?? observationData.thermal_coefficients?.uuc ?? observationData.thermal_coeff?.uuc ?? '';
          const masterCoeff = observationData.thermal_coefficient_master ?? observationData.thermal_coefficients?.master ?? observationData.thermal_coeff?.master ?? '';
          if (uucCoeff || masterCoeff) {
            setThermalCoeff(prev => ({
              ...prev,
              uuc: uucCoeff,
              master: masterCoeff
            }));
          }

          let tsData = Array.isArray(observationData) ? observationData : (observationData.data || []);
          const leastCountMap = {};
          // Same mapping as the initial fetchObservations load
          tsData = tsData.map((point) => {
            const masterLc = point.master_matrix?.leastcount ?? point.least_count ?? point.masterleastcount ?? 0.01;
            const ids = [point.calibration_point_id, point.point_id, point.id].filter(Boolean);
            ids.forEach(id => {
              leastCountMap[id.toString()] = {
                master: parseFloat(masterLc) || 0.01,
                masterLeastCountStr: String(masterLc)
              };
            });
            const observations = point.observations ? [...point.observations] : [];
            const averages = [];
            if (point.readings && Array.isArray(point.readings)) {
              point.readings.forEach((r, idx) => {
                if (r.values && Array.isArray(r.values)) {
                  observations.push(...r.values);
                }
                const decimals = String(masterLc).includes('.') ? String(masterLc).split('.')[1].length : 2;
                let rowAvg = '';
                if (r.average !== undefined && r.average !== null && String(r.average).trim() !== '') {
                  const numAvg = parseFloat(r.average);
                  rowAvg = !isNaN(numAvg) ? numAvg.toFixed(decimals) : String(r.average);
                } else if (r.values && Array.isArray(r.values) && r.values.length > 0) {
                  const nums = r.values.map(v => parseFloat(v.value)).filter(n => !isNaN(n));
                  if (nums.length > 0) {
                    rowAvg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(decimals);
                  }
                }
                if (rowAvg) {
                  averages.push({ repeatable: idx.toString(), value: rowAvg });
                }
              });
            }
            return { ...point, observations, averages };
          });

          if (Object.keys(leastCountMap).length > 0) {
            setLeastCountData(prev => ({ ...prev, ...leastCountMap }));
          }

          if (tsData.length > 0) {
            setObservations(tsData);
          } else {
            // Don't call setObservations([]) — keep existing data so the table stays visible
          }
        }
        else if (observationTemplate === 'observationbiomedical') {
          const rawData = response.data;
          const formatPoint = (p, mode, isSafety) => {
            let effectiveLc = p.least_count;
            let effectiveLcDec = (p.lc_decimals != null && p.lc_decimals !== 'NA' && p.lc_decimals !== '') ? parseInt(p.lc_decimals, 10) : null;

            const mlc = p.master_least_count;
            const mlcDec = (p.mlc_decimals != null && p.mlc_decimals !== 'NA' && p.mlc_decimals !== '') ? parseInt(p.mlc_decimals, 10) : null;

            if (mlc && mlc !== 'NA') {
              const numLc = parseFloat(effectiveLc);
              if (!effectiveLc || effectiveLc === 'NA' || isNaN(numLc)) {
                effectiveLc = mlc;
                effectiveLcDec = mlcDec;
              }
            }

            return {
              ...p,
              id: p.id || p.calibration_point_id,
              mode,
              is_electrical_safety: isSafety,
              least_count: effectiveLc ?? p.least_count,
              lc_decimals: effectiveLcDec ?? p.lc_decimals,
            };
          };
          const measure = Array.isArray(rawData.performance_test?.measure) ? rawData.performance_test.measure : [];
          const source = Array.isArray(rawData.performance_test?.source) ? rawData.performance_test.source : [];
          const safetyMeasure = Array.isArray(rawData.electrical_safety?.measure) ? rawData.electrical_safety.measure : [];
          const safetySource = Array.isArray(rawData.electrical_safety?.source) ? rawData.electrical_safety.source : [];

          const allPoints = [
            ...measure.map(p => formatPoint(p, 'Measure', false)),
            ...source.map(p => formatPoint(p, 'Source', false)),
            ...safetyMeasure.map(p => formatPoint(p, 'Measure', true)),
            ...safetySource.map(p => formatPoint(p, 'Source', true))
          ];
          setObservations(allPoints);

          const visualList = Array.isArray(rawData.visual_test) ? rawData.visual_test : (Array.isArray(rawData.visual_inspection) ? rawData.visual_inspection : null);
          if (visualList) {
            setVisualTests(visualList);
            const vtInputs = {};
            visualList.forEach((t, i) => {
              const val = t.value ?? t.remark ?? '';
              const k = (t.id !== undefined && t.id !== null) ? t.id : i;
              vtInputs[k] = val;
            });
            setVisualTestInputs(prev => ({ ...vtInputs, ...prev }));
          }
          const safetyList = Array.isArray(rawData.basic_safety) ? rawData.basic_safety : (Array.isArray(rawData.basic_safety_test) ? rawData.basic_safety_test : null);
          if (safetyList) {
            const mappedSafety = safetyList.map(t => ({
              ...t,
              minrange: t.min_range ?? t.minrange,
              maxrange: t.max_range ?? t.maxrange,
            }));
            setSafetyTests(mappedSafety);
            const stInputs = {};
            mappedSafety.forEach((t, i) => {
              const rawVal = typeof t.value === 'object' && t.value !== null ? (t.value.value ?? '') : (t.value ?? '');
              const k = (t.id !== undefined && t.id !== null) ? t.id : i;
              stInputs[k] = rawVal;
            });
            setSafetyTestInputs(prev => ({ ...stInputs, ...prev }));
          }

          if (rawData.config) {
            const cfg = rawData.config;
            setBiomedicalConfig(cfg);
            setInstrument(prev => ({
              ...prev,
              biomedical: cfg.biomedical ?? prev?.biomedical ?? 'Yes',
              showvisualtest: cfg.show_visual_test ?? prev?.showvisualtest ?? 'No',
              showbasicsafety: cfg.show_basic_safety ?? prev?.showbasicsafety ?? 'No',
              showelectricalsafety: cfg.show_electrical_safety ?? prev?.showelectricalsafety ?? 'No',
              showperformancetest: (cfg.show_performance ?? cfg.show_performance_test) ?? prev?.showperformancetest ?? 'No',
              mastercount: cfg.master_count ?? prev?.mastercount,
              uuccount: cfg.uuc_count ?? prev?.uuccount,
            }));
          }
        } else if (observationTemplate === 'observationutm' || observationTemplate === 'observationautm') {
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

          const utmObservations = utmData.filter(Boolean);
          if (Array.isArray(observationData.pre_loading_cycles)) {
            utmObservations.preLoadingCycles = observationData.pre_loading_cycles;
          }
          setObservations(utmObservations);
        } else if (observationTemplate === 'observationwb' || observationTemplate === 'observationwbn') {
          let allPoints = [];
          const dataObj = observationData?.data || observationData;
          if (dataObj?.weighing_process || dataObj?.repeatability || dataObj?.eccentricity) {
            const wp = (dataObj.weighing_process?.calibration_points || []).map(p => ({ ...p, mode: 'Weighing Process' }));
            const rp = (dataObj.repeatability?.calibration_points || []).map(p => ({ ...p, mode: 'Repeatability' }));
            const ep = (dataObj.eccentricity?.calibration_points || []).map(p => ({ ...p, mode: 'Eccentricity' }));
            allPoints = [...wp, ...rp, ...ep];
          } else if (Array.isArray(dataObj?.calibration_points)) {
            allPoints = dataObj.calibration_points;
          } else if (Array.isArray(dataObj)) {
            allPoints = dataObj;
          }
          setObservations(allPoints);
        }
        else {
          setObservations([]);
        }
      }
    } catch (error) {
      console.error('Error refetching observations:', error);
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
      const hasConvertedUuc = rowData[2] !== undefined && rowData[2] !== '' && rowData[2] !== null;
      if (hasConvertedUuc) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'calculateduuc',
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
      } else {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: '0',
          value: rowData[1] || '0',
        });
      }
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
      setTableInputValues(prev => ({
        ...prev,
        [`${rowIndex}-9`]: calculated.average || ''
      }));
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
    } else if (selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationvc') {
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
      const point = observations?.[rowIndex];
      const mode = point?.mode?.toLowerCase() || '';

      if (mode.includes('weighing')) {
        [2, 3, 4].forEach((colIdx, obsIdx) => {
          payloads.push({
            inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId,
            type: 'uuc', repeatable: obsIdx.toString(), value: rowData[colIdx] || '0',
          });
        });
        payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averageuuc', repeatable: '0', value: calculated.weighingAverage || '0' });
        payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'error', repeatable: '0', value: calculated.weighingError || '0' });
      } else if (mode.includes('repeatability')) {
        [1, 2, 3, 4, 5].forEach((colIdx, obsIdx) => {
          payloads.push({
            inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId,
            type: 'uucr', repeatable: obsIdx.toString(), value: rowData[colIdx] || '0',
          });
        });
        payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averageuucr', repeatable: '0', value: calculated.repeatabilityAverage || '0' });
      } else if (mode.includes('eccentricity')) {
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((colIdx, obsIdx) => {
          payloads.push({
            inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId,
            type: 'uuce', repeatable: obsIdx.toString(), value: rowData[colIdx] || '0',
          });
        });
        payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'eccentricity', repeatable: '0', value: calculated.eccentricity || '0' });
      }
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
    if (name === 'enddate') {
      const validity = instrument?.calibrationvalidity || '';
      const calculatedDue = calculateDueDate(value, validity);
      setFormData((prev) => ({
        ...prev,
        enddate: value,
        ...(calculatedDue ? { duedate: calculatedDue } : {}),
      }));
      if (errors.enddate) {
        setErrors((prev) => ({ ...prev, enddate: '' }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };


  const renderThermalCoefficientSection = () => {
    if (!selectedTableData?.structure?.thermalCoeff) return null;

    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Thermal Coefficient</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
          <div className={`grid ${selectedTableData.id === 'observationmt' || selectedTableData.id === 'observationexm' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                UUC Thermal Coefficient: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={thermalCoeff.uuc}
                onChange={(e) => {
                  if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                    if (!e.target.value.includes('.') || e.target.value.split('.')[1]?.length <= 10) {
                      setThermalCoeff((prev) => ({ ...prev, uuc: e.target.value }));
                    }
                  }
                }}
                onBlur={(e) => handleThermalCoeffBlur('thermalcoffuuc', e.target.value)}
                className={`w-full px-3 py-2 border ${!thermalCoeff.uuc?.toString().trim() ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white`}
                placeholder="Enter UUC thermal coefficient"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Master Thermal Coefficient: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={thermalCoeff.master}
                onChange={(e) => {
                  if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                    if (!e.target.value.includes('.') || e.target.value.split('.')[1]?.length <= 10) {
                      setThermalCoeff((prev) => ({ ...prev, master: e.target.value }));
                    }
                  }
                }}
                onBlur={(e) => handleThermalCoeffBlur('thermalcoffmaster', e.target.value)}
                className={`w-full px-3 py-2 border ${!thermalCoeff.master?.toString().trim() ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white`}
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
                  onChange={(e) => {
                    if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                      if (!e.target.value.includes('.') || e.target.value.split('.')[1]?.length <= 10) {
                        setThermalCoeff((prev) => ({ ...prev, thickness_of_graduation: e.target.value }));
                      }
                    }
                  }}
                  onBlur={(e) => handleThermalCoeffBlur('thicknessofgraduation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="Enter thickness"
                />
              </div>
            )}
            {/* Additional field for EXM */}
            {selectedTableData.id === 'observationexm' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Parallelism Of Spindle & Anvil (µm):
                </label>
                <input
                  type="text"
                  value={thermalCoeff.parallinternal || ''}
                  onChange={(e) => {
                    if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                      if (!e.target.value.includes('.') || e.target.value.split('.')[1]?.length <= 10) {
                        setThermalCoeff((prev) => ({ ...prev, parallinternal: e.target.value }));
                      }
                    }
                  }}
                  onBlur={(e) => handleThermalCoeffBlur('parallinternal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="Enter parallelism value"
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
                        let currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                        const point = modeGroup.calibration_points[relativeRowIndex];
                        if ((colIndex === 10 || colIndex === 11) && point) {
                          const lc = colIndex === 10 ? point.least_count : point.least_count;
                          const decimals = colIndex === 10 ? point.lc_decimals : point.lc_decimals;
                          currentValue = formatValueByLc(currentValue, decimals, lc);
                        }

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
                        // colIndex 8 = Obs 4
                        // colIndex 9 = Obs 5
                        // colIndex 10 = Average (read only in PHP)
                        // colIndex 11 = Error (read only in PHP)
                        const isObs45Disabled = false; // Observation 4 and 5 are always editable for UC
                        const isDisabled = [0, 3, 4, 10, 11].includes(colIndex) || isObs45Disabled;

                        return (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 align-middle">
                            <input
                              type="text"
                              className={`w-full min-w-[50px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent ${isObs45Disabled
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed select-none'
                                : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
                                } ${isDisabled && !isObs45Disabled ? 'cursor-not-allowed' : ''} ${observationErrors[key] ? 'border-red-500' : ''}`}
                              value={currentValue}
                              onChange={(e) => {
                                if (isDisabled) return;
                                const fieldType = colIndex === 2 ? 'text' : 'numeric';
                                // handleInputChange sets or clears this cell's least-count error itself
                                handleInputChange(actualRowIndex, colIndex, e.target.value, fieldType);
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
                          onChange={(e) => handleInputChange(rowIndex, 3, e.target.value, 'text')}
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

  // Shared calculation logic — computes averages and deviation for a given point
  // Returns { avgUuc, avgMaster, error } so both onChange and onBlur can use fresh values
  const computeBiomedicalAverages = (pointId, type, index, value, masterCount, uucCount, existingValues) => {
    const point = (selectedTableData?.calibration_points ?? []).find(p => String(p.id ?? p.calibration_point_id) === String(pointId));
    if (!point) return { avgUuc: '', avgMaster: '', error: '' };

    const isMasterReadOnly = point.mode === 'Measure';
    const isUucReadOnly = point.mode === 'Source';
    const setPointRaw = (point.set_point ?? point.point ?? '').toString().trim();

    // Skip least count validation for waveform and nibp parameters
    const parametervalue = (point?.parameter || point?.unittype || '').toLowerCase();
    const isWaveform = parametervalue.includes('waveform');
    const isNIBP = parametervalue.includes('nibp');

    // ✅ CORRECTED: Format average using ONLY configured decimals (strict rounding)
    const formatAverage = (sum, count, configuredDecimals, leastCount) => {
      if (count === 0) return '';
      const raw = sum / count;

      let targetDec = 0;

      // 1. First try configured decimals (lc_decimals / mlc_decimals from backend)
      if (configuredDecimals != null && configuredDecimals !== 'NA' && configuredDecimals !== '') {
        const p = parseInt(configuredDecimals, 10);
        if (!isNaN(p)) targetDec = p;
      }

      // 2. If no configured decimals, derive from leastCount
      if (targetDec === 0 && configuredDecimals == null) {
        if (leastCount != null && leastCount !== 'NA' && leastCount !== '') {
          const s = String(leastCount).trim();
          if (s.includes('.')) {
            targetDec = s.split('.')[1].length;
          }
        }
      }

      // ✅ STRICT rounding: Use ONLY the configured/derived decimals
      // Do NOT add extra decimals from raw calculation
      return raw.toFixed(targetDec);
    };

    // Build the updated key map including the current change
    const key = `${pointId}-${type}${type === 'master' || type === 'uuc' ? `-${index}` : ''}`;
    const vals = { ...existingValues, [key]: value };

    // Helper function to calculate average for blood pressure format (NIBP)
    const calculateBPAverage = (values) => {
      const systolicValues = [];
      const diastolicValues = [];

      values.forEach(val => {
        if (typeof val === 'string' && val.includes('/')) {
          const parts = val.split('/');
          if (parts.length === 2) {
            const sys = parseFloat(parts[0].trim());
            const dia = parseFloat(parts[1].trim());
            if (!isNaN(sys)) systolicValues.push(sys);
            if (!isNaN(dia)) diastolicValues.push(dia);
          }
        }
      });

      if (systolicValues.length === 0 || diastolicValues.length === 0) return '';

      const avgSys = systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length;
      const avgDia = diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length;

      return `${Math.round(avgSys)}/${Math.round(avgDia)}`;
    };

    // Collect all UUC values
    const uucValues = [];
    for (let i = 0; i < uucCount; i++) {
      let uucVal;
      if (isUucReadOnly) {
        uucVal = point.uuc_readings?.[i]?.value ?? setPointRaw;
      } else {
        uucVal = vals[`${pointId}-uuc-${i}`] ?? point.uuc_readings?.[i]?.value ?? '';
      }
      if (uucVal !== '' && uucVal !== null && uucVal !== undefined) uucValues.push(String(uucVal));
    }

    // Collect all Master values
    const masterValues = [];
    for (let i = 0; i < masterCount; i++) {
      let masterVal;
      if (isMasterReadOnly) {
        masterVal = point.master_readings?.[i]?.value ?? setPointRaw;
      } else {
        masterVal = vals[`${pointId}-master-${i}`] ?? point.master_readings?.[i]?.value ?? '';
      }
      if (masterVal !== '' && masterVal !== null && masterVal !== undefined) masterValues.push(String(masterVal));
    }

    let avgUuc, avgMaster, error;

    if (isWaveform) {
      avgUuc = type === 'averageuuc' ? value : (vals[`${pointId}-averageuuc`] ?? point.average_uuc ?? '');
      let masterSum = 0, masterCountNum = 0;
      masterValues.forEach(val => {
        const num = parseFloat(val);
        if (!isNaN(num)) { masterSum += num; masterCountNum++; }
      });
      avgMaster = formatAverage(masterSum, masterCountNum, point.mlc_decimals, point.master_least_count);
      error = '';
      return { avgUuc, avgMaster, error };
    }

    if (isNIBP) {
      // Calculate averages for blood pressure format (NIBP)
      avgUuc = calculateBPAverage(uucValues);
      avgMaster = calculateBPAverage(masterValues);

      // Calculate error for BP format (systolic error / diastolic error)
      if (avgUuc && avgMaster) {
        const uucParts = avgUuc.split('/');
        const masterParts = avgMaster.split('/');
        if (uucParts.length === 2 && masterParts.length === 2) {
          const sysError = parseFloat(uucParts[0]) - parseFloat(masterParts[0]);
          const diaError = parseFloat(uucParts[1]) - parseFloat(masterParts[1]);
          error = `${sysError}/${diaError}`;
        } else {
          error = '';
        }
      } else {
        error = '';
      }
    } else {
      // Calculate averages for regular numeric format
      let uucSum = 0, uucCountNum = 0, masterSum = 0, masterCountNum = 0;

      uucValues.forEach(val => {
        const num = parseFloat(val);
        if (!isNaN(num)) { uucSum += num; uucCountNum++; }
      });

      masterValues.forEach(val => {
        const num = parseFloat(val);
        if (!isNaN(num)) { masterSum += num; masterCountNum++; }
      });

      avgUuc = formatAverage(uucSum, uucCountNum, point.lc_decimals, point.least_count);
      avgMaster = formatAverage(masterSum, masterCountNum, point.mlc_decimals, point.master_least_count);

      // ✅ CORRECTED: Use ROUNDED averages for deviation calculation
      const finalUuc = avgUuc !== '' ? parseFloat(avgUuc) : 0;
      const finalMaster = avgMaster !== '' ? parseFloat(avgMaster) : 0;

      // ✅ CORRECTED: Deviation decimals = MAX(lc_decimals, mlc_decimals)
      let lcDec = 0;
      let mlcDec = 0;

      if (point.lc_decimals != null && point.lc_decimals !== 'NA' && point.lc_decimals !== '') {
        const p = parseInt(point.lc_decimals, 10);
        if (!isNaN(p)) lcDec = p;
      }
      if (point.mlc_decimals != null && point.mlc_decimals !== 'NA' && point.mlc_decimals !== '') {
        const p = parseInt(point.mlc_decimals, 10);
        if (!isNaN(p)) mlcDec = p;
      }

      // If no configured decimals, derive from least counts
      if (lcDec === 0 && point.least_count != null && point.least_count !== 'NA' && point.least_count !== '') {
        const lcStr = String(point.least_count).trim();
        if (lcStr.includes('.')) lcDec = lcStr.split('.')[1].length;
      }
      if (mlcDec === 0 && point.master_least_count != null && point.master_least_count !== 'NA' && point.master_least_count !== '') {
        const mlcStr = String(point.master_least_count).trim();
        if (mlcStr.includes('.')) mlcDec = mlcStr.split('.')[1].length;
      }

      const devDecimals = Math.max(lcDec, mlcDec);
      error = (avgUuc !== '' || avgMaster !== '') ? (finalUuc - finalMaster).toFixed(devDecimals) : '';
    }

    return { avgUuc, avgMaster, error };
  };


  const handleBiomedicalInputChange = (pointId, type, index, value, masterCount = 1, uucCount = 5) => {
    const point = (selectedTableData?.calibration_points ?? []).find(p => String(p.id ?? p.calibration_point_id) === String(pointId));
    const parametervalue = (point?.parameter || point?.unittype || '').toLowerCase();
    const isNIBP = parametervalue.includes('nibp');

    // Restrict '/' character to NIBP parameters only
    if (!isNIBP && typeof value === 'string' && value.includes('/')) {
      return;
    }

    const key = `${pointId}-${type}${type === 'master' || type === 'uuc' ? `-${index}` : ''}`;

    setTableInputValues(prev => {
      const { avgUuc, avgMaster, error } = computeBiomedicalAverages(pointId, type, index, value, masterCount, uucCount, prev);
      return {
        ...prev,
        [key]: value,
        [`${pointId}-averageuuc`]: avgUuc,
        [`${pointId}-averagemaster`]: avgMaster,
        [`${pointId}-error`]: error,
      };
    });
  };

  // DW (dead weight) reading types are per-cycle, exactly like master/uuc readings.
  const CYCLE_INDEXED_TYPES = ['master', 'uuc', 'pressure', 'uuca', 'mastera', 'masterb', 'uucb', 'deltai'];

  const handleBiomedicalInputBlur = async (pointId, type, index, currentValue, masterCount = 1, uucCount = 5, options = {}) => {
    const key = `${pointId}-${type}${type === 'master' || type === 'uuc' ? `-${index}` : ''}`;
    // Use the value passed directly from the input (avoids stale closure on tableInputValues)
    const value = currentValue !== undefined ? currentValue : (tableInputValues[key] || '');

    const point = observations.find(p => String(p.id || p.calibration_point_id) === String(pointId));
    const parametervalue = (point?.parameter || point?.unittype || '').toLowerCase();
    const isWaveform = parametervalue.includes('waveform');
    const isNIBP = parametervalue.includes('nibp');

    if (!isWaveform && !isNIBP && (type === 'master' || type === 'averagemaster' || type === 'uuc' || type === 'averageuuc') && value && value.trim()) {
      let leastCount = point?.least_count;
      let masterLeastCount = point?.master_least_count;

      if (masterLeastCount && masterLeastCount !== 'NA') {
        const numLc = parseFloat(leastCount);
        if (!leastCount || leastCount === 'NA' || isNaN(numLc)) {
          leastCount = masterLeastCount;
        }
      }
      leastCount = leastCount || '0.01';
      masterLeastCount = masterLeastCount || '0.01';

      const targetLc = (type === 'master' || type === 'averagemaster') ? masterLeastCount : leastCount;
      const numValue = parseFloat(value);
      const targetLcNum = parseFloat(targetLc);

      if (isNaN(numValue)) {
        setObservationErrors(prevErrors => ({ ...prevErrors, [key]: 'Please enter a valid number' }));
        return;
      } else if (targetLcNum && !isNaN(targetLcNum) && targetLcNum > 0) {
        const targetLcStr = String(targetLc).trim();
        const decPlaces = targetLcStr.includes('.') ? targetLcStr.split('.')[1].length : 0;
        const valDecPlaces = value.includes('.') ? value.split('.')[1].length : 0;

        if (decPlaces > 0 && valDecPlaces > decPlaces) {
          setObservationErrors(prevErrors => ({
            ...prevErrors,
            [key]: `Maximum ${decPlaces} decimal place(s) allowed for least count ${targetLc}`
          }));
          return;
        } else if (numValue !== 0) {
          if (numValue < targetLcNum) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please enter a value with in leastcount ${targetLc}`
            }));
            return;
          } else {
            const factor = 1000000;
            const scaledVal = Math.round(numValue * factor);
            const scaledLc = Math.round(targetLcNum * factor);
            const remainder = scaledVal % scaledLc;
            if (remainder !== 0) {
              setObservationErrors(prevErrors => ({
                ...prevErrors,
                [key]: `Please Enter Value divisible by ${targetLc}`
              }));
              return;
            }
          }
        }
      }

      // If valid, clear any error on this key
      setObservationErrors(prevErrors => {
        if (!prevErrors[key]) return prevErrors;
        const newErrors = { ...prevErrors };
        delete newErrors[key];
        return newErrors;
      });
    }

    // Recompute averages fresh with the current value so we don't read stale state
    const { avgUuc, avgMaster, error } = computeBiomedicalAverages(
      pointId, type, index, value, masterCount, uucCount, tableInputValues
    );

    // Persist individual reading to localStorage so it survives page reload
    // (backend may return null for individual readings even after saving)
    if (type === 'master' || type === 'uuc' || type === 'specification' || type === 'averageuuc') {
      try {
        const cacheKey = `bio_obs_${inwardId}_${instId}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
        cached[key] = value;
        // Also cache computed averages so they restore too
        cached[`${pointId}-averagemaster`] = avgMaster || '0';
        cached[`${pointId}-averageuuc`] = avgUuc || '0';
        cached[`${pointId}-error`] = error || '0';
        localStorage.setItem(cacheKey, JSON.stringify(cached));
      } catch { /* ignore storage errors */ }
    }

    if (type === 'pressure') {
      if (index === 0 || index === '0') {
        setFormData(prev => ({ ...prev, pressurestart: value }));
        setTableInputValues(prev => ({ ...prev, [`${instId}-pressure-start`]: value }));
      } else if (index === 1 || index === '1') {
        setFormData(prev => ({ ...prev, pressureend: value }));
        setTableInputValues(prev => ({ ...prev, [`${instId}-pressure-end`]: value }));
      }
    } else if (type === 'stabilizationtime') {
      setFormData(prev => ({ ...prev, stabilizationtime: value }));
      setTableInputValues(prev => ({ ...prev, [`${instId}-stabilization`]: value }));
    }

    const payload = {
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: pointId,
      type: type,
      // PHP stores stabilizationtime at repeatable=1, not 0.
      repeatable: CYCLE_INDEXED_TYPES.includes(type)
        ? index.toString()
        : (type === 'stabilizationtime' ? '1' : '0'),
      value: value || '0',
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${JWT_HOST_API}/calibrationprocess/set-observations`,
        payload,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      if (type === 'uuc' || type === 'master' || type === 'averageuuc') {
        const avgKeyFrontend = type === 'master' ? 'averagemaster' : 'averageuuc';
        const avgVal = type === 'master' ? (avgMaster || '0') : (avgUuc || value || '0');

        await axios.post(`${JWT_HOST_API}/calibrationprocess/set-observations`, {
          inwardid: inwardId, instid: instId, calibrationpoint: pointId, type: avgKeyFrontend, repeatable: '0', value: avgVal
        }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });

        if (type !== 'averageuuc') {
          await axios.post(`${JWT_HOST_API}/calibrationprocess/set-observations`, {
            inwardid: inwardId, instid: instId, calibrationpoint: pointId, type: 'error', repeatable: '0', value: error || '0'
          }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
        }
      }

      if (response.data.status || response.data.staus || response.data.success) {
        if (!options.silent) toast.success('Observation saved successfully');
      } else {
        toast.error('Failed to save observation');
      }
    } catch (error) {
      console.error('Error saving observation:', error);
      toast.error('Failed to save observation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!validateForm()) {
      toast.error('Please correct the validation errors before submitting.');
      return;
    }

    // Validate observation fields
    const obsValidation = validateObservationFields();
    if (!obsValidation.isValid) {
      const firstErrorKey = obsValidation.firstErrorKey;
      const count = obsValidation.errorCount;
      const fieldLabel = getObservationFieldLabel(firstErrorKey, selectedTableData);

      if (count > 0) {
        const errorReason = obsValidation.errors[firstErrorKey];
        const reasonSuffix = errorReason && errorReason !== 'This field is required' ? ` (${errorReason})` : '';
        toast.error(
          count > 1
            ? `Please fill all required observation fields (${count} missing/invalid). First: ${fieldLabel}${reasonSuffix}`
            : `Please check observation field: ${fieldLabel}${reasonSuffix}`
        );
      }

      if (firstErrorKey) {
        const [rowIndex, colIndex] = firstErrorKey.split('-');
        console.error('❌ First validation error at:', { rowIndex, colIndex, fieldLabel, error: obsValidation.errors[firstErrorKey] });

        setTimeout(() => {
          const errorInput =
            document.querySelector(`[data-cell-key="${firstErrorKey}"]`) ||
            document.getElementById(`obs-cell-${firstErrorKey}`) ||
            document.querySelector(`.border-red-500`);

          if (errorInput) {
            errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorInput.focus();
            errorInput.classList.add('ring-4', 'ring-red-400');
            setTimeout(() => {
              errorInput.classList.remove('ring-4', 'ring-red-400');
            }, 3000);
          }
        }, 100);
      }
      return;
    }

    const token = localStorage.getItem('authToken');


    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    const firstRowCalibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[0] || instId;
    const thermalCalibrationPointId = (selectedTableData.id === 'observationmt' || selectedTableData.id === 'observationts') ? instId : firstRowCalibPointId;

    // Add thermal coefficients for applicable observation types
    if (selectedTableData.id === 'observationctg' ||
      selectedTableData.id === 'observationit' ||
      selectedTableData.id === 'observationmt' ||
      selectedTableData.id === 'observationexm' ||
      selectedTableData.id === 'observationfg' ||
      selectedTableData.id === 'observationhg' ||
      selectedTableData.id === 'observationdg' ||
      selectedTableData.id === 'observationts' ||
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

    // Process each row. Some templates (AUTM) render their own table and persist
    // via the blur handler, so they have no staticRows at all.
    (selectedTableData.staticRows || []).forEach((row, rowIndex) => {
      let calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex] || '';
      if (selectedTableData?.id === 'observationgtm') {
        const pointIdx = Math.floor(rowIndex / 2);
        const pointObj = observations?.[pointIdx] || selectedTableData?.calibration_points?.[pointIdx];
        calibPointId = pointObj?.point_id || pointObj?.id || pointObj?.calibration_point_id || calibPointId;
      }

      const rowData = row.map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return tableInputValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData, selectedTableData.id, rowIndex);

      // 0. observationcustom
      if (selectedTableData.id === 'observationcustom') {
        const layout = getCustomLayoutIndices(instrument);
        if (layout) {
          if (layout.paramIdx !== -1) {
            calibrationPoints.push(calibPointId);
            types.push('parameter');
            repeatables.push('0');
            values.push(rowData[layout.paramIdx] ?? '');
          }
          if (layout.specIdx !== -1) {
            calibrationPoints.push(calibPointId);
            types.push('specification');
            repeatables.push('0');
            values.push(rowData[layout.specIdx] ?? '');
          }
          if (layout.setpointIdx !== -1) {
            calibrationPoints.push(calibPointId);
            const ci = getCustomInstrument();
            const setpointType = ci.setpoint === 'Master' ? 'master' : (ci.setpoint === 'UUC' ? 'uuc' : 'setpoint');
            types.push(setpointType);
            repeatables.push('0');
            values.push(rowData[layout.setpointIdx] ?? '');
          }
          layout.masterObsIndices.forEach((colIdx, i) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(i.toString());
            values.push(rowData[colIdx] ?? '');
          });
          if (layout.avgMasterIdx !== -1) {
            calibrationPoints.push(calibPointId);
            types.push('averagemaster');
            repeatables.push('0');
            values.push(calculated.averagemaster ?? '');
          }
          layout.uucObsIndices.forEach((colIdx, i) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(i.toString());
            values.push(rowData[colIdx] ?? '');
          });
          if (layout.avgUucIdx !== -1) {
            calibrationPoints.push(calibPointId);
            types.push('averageuuc');
            repeatables.push('0');
            values.push(calculated.averageuuc ?? '');
          }
          if (layout.errorIdx !== -1) {
            calibrationPoints.push(calibPointId);
            types.push('error');
            repeatables.push('0');
            values.push(calculated.error ?? '');
          }
          if (layout.remarkIdx !== -1) {
            calibrationPoints.push(calibPointId);
            types.push('remark');
            repeatables.push('0');
            values.push(rowData[layout.remarkIdx] ?? '');
          }
        }
      }

      else if (selectedTableData.id === 'observationutm') {
        const rowMeta = selectedTableData.rowMeta?.[rowIndex];
        if (rowMeta?.kind === 'point') {
          const pointId = calibPointId;
          const setpoint = rowData[1] || '0';
          const calculatedUuc = rowData[2] || '0';

          const startTemp = parseFloat(instrument?.temperature ?? inwardEntry?.temperature ?? inwardEntry?.tempstart) || 0;
          const endTemp = parseFloat(formData?.tempend) || 0;
          const roomTemp = (startTemp > 0 && endTemp > 0) ? (startTemp + endTemp) / 2 : (endTemp || startTemp || 0);
          const compUuc = (calculatedUuc && roomTemp > 0)
            ? ((0.00027 * (roomTemp - 23) + 1) * parseFloat(calculatedUuc)).toFixed(1)
            : (rowData[3] || calculatedUuc || '0');

          const m0 = tableInputValues[`${pointId}-m0`] ?? rowData[4] ?? '';
          const m1 = tableInputValues[`${pointId}-m1`] ?? rowData[5] ?? '';
          const m2 = tableInputValues[`${pointId}-m2`] ?? rowData[6] ?? '';
          const masters = [m0, m1, m2];

          // 1. setpoint
          calibrationPoints.push(pointId);
          types.push('setpoint');
          repeatables.push('0');
          values.push(setpoint);

          // 2. calculateduuc
          calibrationPoints.push(pointId);
          types.push('calculateduuc');
          repeatables.push('0');
          values.push(calculatedUuc);

          // 3. uuc (room temp compensated)
          calibrationPoints.push(pointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(compUuc);

          // 4. master readings
          masters.forEach((m, mIdx) => {
            calibrationPoints.push(pointId);
            types.push('master');
            repeatables.push(mIdx.toString());
            values.push(m || '0');
          });

          // 5. averagemaster
          calibrationPoints.push(pointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(calculated.average || rowData[7] || '0');

          // 6. error
          calibrationPoints.push(pointId);
          types.push('error');
          repeatables.push('0');
          values.push(calculated.error || rowData[8] || '0');

          // 7. percenterror
          calibrationPoints.push(pointId);
          types.push('percenterror');
          repeatables.push('0');
          values.push(calculated.percentError || rowData[9] || '0');

          // 8. repeatability
          calibrationPoints.push(pointId);
          types.push('repeatability');
          repeatables.push('0');
          values.push(calculated.repeatability || rowData[10] || '0');
        } else if (rowMeta?.kind === 'removal') {
          [0, 1, 2].forEach((posIdx) => {
            const val = tableInputValues[`removalforce-${posIdx}`] ?? rowData[4 + posIdx] ?? '0';
            calibrationPoints.push(calibPointId);
            types.push('removalforce');
            repeatables.push(posIdx.toString());
            values.push(val || '0');
          });
        } else if (rowMeta?.kind === 'zeroerror') {
          [0, 1, 2].forEach((posIdx) => {
            const zeroVal = calculated[`zero${posIdx}`] || rowData[4 + posIdx] || '0';
            calibrationPoints.push(calibPointId);
            types.push('zeroerror');
            repeatables.push(posIdx.toString());
            values.push(zeroVal || '0');
          });
        } else if (rowMeta?.kind === 'resolution') {
          calibrationPoints.push(calibPointId);
          types.push('releativeres');
          repeatables.push('0');
          values.push(rowData[8] || '0');
        } else if (rowMeta?.kind === 'machine') {
          calibrationPoints.push(calibPointId);
          types.push('classofmachine');
          repeatables.push('0');
          values.push(tableInputValues['classofmachine'] ?? rowData[1] ?? '0');

          calibrationPoints.push(calibPointId);
          types.push('dialguageseting');
          repeatables.push('0');
          values.push(tableInputValues['dialguagesetting'] ?? rowData[5] ?? '0');
        }
      }

      // 1. observationdpg
      else if (selectedTableData.id === 'observationdpg') {
        const hasConvertedUuc = rowData[2] !== undefined && rowData[2] !== '' && rowData[2] !== null;
        if (hasConvertedUuc) {
          calibrationPoints.push(calibPointId);
          types.push('calculateduuc');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[2] || '0');
        } else {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[1] || '0');
        }

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
      else if (selectedTableData.id === 'observationsutm') {
        // Every PHP field of the row; speeds, mean speed and error freshly calculated
        const calculatedCells = getSUTMCalculatedCells(rowData, selectedTableData.rowMeta?.[rowIndex], observations?.[rowIndex]?.cusset_error);
        rowData.forEach((cell, colIndex) => {
          const field = getSUTMFieldType(colIndex);
          if (!field) return;
          const cellValue = colIndex in calculatedCells ? calculatedCells[colIndex] : cell;
          calibrationPoints.push(calibPointId);
          types.push(field.type);
          repeatables.push(field.repeatable);
          values.push(cellValue || '0');
        });
      }
      else if (selectedTableData.id === 'observationsw') {
        // Every PHP field of the row as shown; averages and error can be edited by hand in PHP
        const rowType = getSWRowType(rowData);
        rowData.forEach((cell, colIndex) => {
          const field = getSWFieldType(rowType, colIndex);
          if (!field) return;
          calibrationPoints.push(calibPointId);
          types.push(field.type);
          repeatables.push(field.repeatable);
          values.push(cell || '0');
        });
      }
      else if (selectedTableData.id === 'observationtswi') {
        // Every PHP field of the row; calculated cells use freshly calculated values
        const rowType = getTSWIRowType(rowData);
        const calculatedCells = rowType === 'uuc'
          ? { [TSWI_COLS.CONVERTED_AVERAGE]: calculated.average, [TSWI_COLS.DEVIATION]: calculated.error }
          : { [TSWI_COLS.AVERAGE]: calculated.average, [TSWI_COLS.CORRECTED_AVERAGE]: calculated.correctedAverage };
        rowData.forEach((cell, colIndex) => {
          const field = getTSWIFieldType(rowType, colIndex);
          if (!field) return;
          const cellValue = colIndex in calculatedCells ? calculatedCells[colIndex] : cell;
          calibrationPoints.push(calibPointId);
          types.push(field.type);
          repeatables.push(field.repeatable);
          values.push(cellValue || '0');
        });
      }
      else if (selectedTableData.id === 'observationtswoi') {
        // Every PHP field of the row; calculated cells use freshly calculated values
        const rowType = getTSWOIRowType(rowData);
        const calculatedCells = {
          [TSWOI_COLS.AVERAGE]: calculated.average,
          [TSWOI_COLS.CORRECTED_AVERAGE]: calculated.correctedAverage,
          [TSWOI_COLS.DEVIATION]: calculated.error,
        };
        rowData.forEach((cell, colIndex) => {
          const field = getTSWOIFieldType(rowType, colIndex);
          if (!field) return;
          const cellValue = colIndex in calculatedCells ? calculatedCells[colIndex] : cell;
          calibrationPoints.push(calibPointId);
          types.push(field.type);
          repeatables.push(field.repeatable);
          values.push(cellValue || '0');
        });
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
        const isUUCRow = rowIndex % 2 === 0 || row[3] === 'UUC';
        const isMasterRow = rowIndex % 2 === 1 || row[3] === 'Master';

        if (isUUCRow) {
          // UUC row payloads
          const rowData = row.map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          });

          // Set Point (col 1: type setpoint)
          calibrationPoints.push(calibPointId);
          types.push('setpoint');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          // Range (col 2: type range)
          calibrationPoints.push(calibPointId);
          types.push('range');
          repeatables.push('0');
          values.push(rowData[2] || '');

          // Observations 1-5 (cols 6-10: type uuc, repeatable 0-4)
          [6, 7, 8, 9, 10].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] ?? '');
          });

          // Average (°C) for UUC (col 12: type averageuuc)
          const uucAverageC = rowData[12] ?? '';
          calibrationPoints.push(calibPointId);
          types.push('averageuuc');
          repeatables.push('0');
          values.push(uucAverageC);

          // Deviation (°C) (col 13: type error)
          const latestDeviation = tableInputValues[`${rowIndex}-13`] ?? rowData[13] ?? '';
          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(latestDeviation);


        } else if (isMasterRow) {
          // Master row payloads
          const rowData = row.map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          });

          // Master Unit (col 4: type masterunit)
          const unitVal = rowData[4] || '';
          const selectedUnit = unitsList.find(u => u.label === unitVal || u.value === unitVal || u.unitDesc === unitVal);
          calibrationPoints.push(calibPointId);
          types.push('masterunit');
          repeatables.push('0');
          values.push(selectedUnit ? selectedUnit.value.toString() : unitVal || '0');

          // Sensitivity Coefficient (col 5: type sensitivitycoefficient)
          calibrationPoints.push(calibPointId);
          types.push('sensitivitycoefficient');
          repeatables.push('0');
          values.push(rowData[5] || '');

          // Observations 1-5 (cols 6-10: type master, repeatable 0-4)
          [6, 7, 8, 9, 10].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] ?? '');
          });

          // Average (Ω) (col 11: type averagemaster)
          const masterAverageOmega = rowData[11] ?? '';
          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(masterAverageOmega);

          // Average (°C) for Master (col 12: type caveragemaster)
          const masterConvertedAvg = rowData[12] ?? '';
          calibrationPoints.push(calibPointId);
          types.push('caveragemaster');
          repeatables.push('0');
          values.push(masterConvertedAvg);

        }
      }

      else if (selectedTableData.id === 'observationpr') {
        // calibPointId already resolved above from selectedTableData.hiddenInputs.calibrationPoints[rowIndex],
        // which createPRRows() populates from each point's real calib_point_id. ObservationPR.jsx writes the
        // same value as its `pointId` when saving into tableInputValues (`${pointId}-m0`, `mast0er${pointId}`, etc.)
        // so we key off calibPointId here to match.

        // 1. Setpoint (col 1: type setpoint, repeatable 0)
        calibrationPoints.push(calibPointId);
        types.push('setpoint');
        repeatables.push('0');
        values.push(tableInputValues[`${rowIndex}-1`] ?? rowData[1] ?? '0');

        // 2. Observations 1-3 (cols 2, 3, 4: type master, repeatable 0, 1, 2)
        [2, 3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          const masterVal =
            tableInputValues[`${calibPointId}-m${obsIndex}`] ??
            tableInputValues[`mast${obsIndex}er${calibPointId}`] ??
            tableInputValues[`${rowIndex}-${colIndex}`] ??
            rowData[colIndex] ??
            '';
          values.push(masterVal);
        });

        // 3. Mean (col 5: type averagemaster, repeatable 0)
        const meanVal =
          tableInputValues[`${calibPointId}-averagemaster`] ??
          tableInputValues[`averagemaster${calibPointId}`] ??
          tableInputValues[`${rowIndex}-5`] ??
          rowData[5] ??
          '';
        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(meanVal);

        // 4. Repeatability (col 6: type repeatability, repeatable 0)
        const repVal =
          tableInputValues[`${calibPointId}-repeatability`] ??
          tableInputValues[`repeatability${calibPointId}`] ??
          tableInputValues[`${rowIndex}-6`] ??
          rowData[6] ??
          '';
        calibrationPoints.push(calibPointId);
        types.push('repeatability');
        repeatables.push('0');
        values.push(repVal);

        // 5. Factor (col 7: type factor, repeatable 0)
        const factorVal =
          tableInputValues[`${calibPointId}-factor`] ??
          tableInputValues[`factor${calibPointId}`] ??
          tableInputValues[`${rowIndex}-7`] ??
          rowData[7] ??
          '';
        calibrationPoints.push(calibPointId);
        types.push('factor');
        repeatables.push('0');
        values.push(factorVal);
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

      // 9. observationexm & observationvc
      else if (selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationvc') {
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
          const avgDiff = countDiff > 0 ? parseFloat((sumDiff / countDiff).toFixed(8)).toString() : '0';

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

      else if (selectedTableData.id === 'observationts') {
        const rc = selectedTableData.hiddenInputs?.repeatables?.[rowIndex] ?? (rowIndex % 5).toString();

        for (let i = 0; i < 8; i++) {
          const colIdx = i + 1;
          const readingValue = rowData[colIdx] || '0';
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(`${rc}-${i}`);
          values.push(readingValue);
        }

        const avgValue = calculated.average || tableInputValues[`${rowIndex}-9`] || rowData[9] || '0';
        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push(rc.toString());
        values.push(avgValue);
      }

    });

    // Special handling for observationbiomedical since it renders dynamic points rather than staticRows
    if (selectedTableData?.id === 'observationbiomedical') {
      const domCalib = Array.from(document.querySelectorAll("input[name='calibrationpoint[]']")).map(el => el.value);
      const domType = Array.from(document.querySelectorAll("input[name='type[]']")).map(el => el.value);
      const domRepeatable = Array.from(document.querySelectorAll("input[name='repeatable[]']")).map(el => el.value);
      const domValue = Array.from(document.querySelectorAll("input[name='value[]']")).map(el => el.value);

      if (domCalib.length > 0) {
        domCalib.forEach((cp, idx) => {
          calibrationPoints.push(cp);
          types.push(domType[idx] || '');
          repeatables.push(domRepeatable[idx] || '0');
          values.push(domValue[idx] !== undefined ? String(domValue[idx]) : '');
        });
      } else {
        const bioPoints = (selectedTableData?.calibration_points && selectedTableData.calibration_points.length > 0)
          ? selectedTableData.calibration_points
          : (observations || []);

        const activeBioPoints = bioPoints.filter(p => {
          const isSafety = p.is_electrical_safety || p.biomedical_section === 'Electrical Safety';
          if (isSafety) return isElectricalSafetyVisible;
          return isPerformanceVisible;
        });
        const pointsToProcess = activeBioPoints;

        pointsToProcess.forEach((row) => {
          const pointId = row.calibration_point_id || row.id;
          if (!pointId) return;

          const isSource = row.mode === 'Source';
          const isMasterReadOnly = row.mode === 'Measure';
          const isUucReadOnly = row.mode === 'Source';

          const masterCount = Array.isArray(row.master_readings) && row.master_readings.length > 0
            ? row.master_readings.length
            : (isSource ? 5 : 1);
          const uucCount = Array.isArray(row.uuc_readings) && row.uuc_readings.length > 0
            ? row.uuc_readings.length
            : (isSource ? 1 : 5);

          // 1. Parameter
          const paramVal = tableInputValues[`${pointId}-parameter`] ?? row.parameter ?? row.unittype ?? '';
          if (paramVal !== '') {
            calibrationPoints.push(pointId);
            types.push('parameter');
            repeatables.push('0');
            values.push(String(paramVal));
          }

          // 2. Setpoint
          const setPointVal = row.set_point ?? row.point ?? '';
          if (setPointVal !== '') {
            calibrationPoints.push(pointId);
            types.push('setpoint');
            repeatables.push('0');
            values.push(String(setPointVal));
          }

          // 3. Master readings (up to masterCount)
          for (let i = 0; i < masterCount; i++) {
            const fallbackVal = isMasterReadOnly ? (row.master_readings?.[i]?.value ?? setPointVal) : (row.master_readings?.[i]?.value ?? '');
            const mVal = tableInputValues[`${pointId}-master-${i}`] !== undefined
              ? tableInputValues[`${pointId}-master-${i}`]
              : fallbackVal;
            calibrationPoints.push(pointId);
            types.push('master');
            repeatables.push(i.toString());
            values.push(mVal !== null && mVal !== undefined ? String(mVal) : '');
          }

          // 4. Average Master — use value stored by computeBiomedicalAverages when user entered readings
          // If not in state (page just loaded, no edits), compute fresh from readings via same function
          let avgMasterVal = tableInputValues[`${pointId}-averagemaster`];
          if (avgMasterVal === undefined || avgMasterVal === null || avgMasterVal === '') {
            const computed = computeBiomedicalAverages(pointId, 'master', 0, '', masterCount, uucCount, tableInputValues);
            avgMasterVal = computed.avgMaster || null;
          }
          if (avgMasterVal !== null && avgMasterVal !== undefined && avgMasterVal !== '') {
            calibrationPoints.push(pointId);
            types.push('averagemaster');
            repeatables.push('0');
            values.push(String(avgMasterVal));
          }

          // 5. UUC readings (up to uucCount)
          for (let i = 0; i < uucCount; i++) {
            const fallbackVal = isUucReadOnly ? (row.uuc_readings?.[i]?.value ?? setPointVal) : (row.uuc_readings?.[i]?.value ?? '');
            const uVal = tableInputValues[`${pointId}-uuc-${i}`] !== undefined
              ? tableInputValues[`${pointId}-uuc-${i}`]
              : fallbackVal;
            calibrationPoints.push(pointId);
            types.push('uuc');
            repeatables.push(i.toString());
            values.push(uVal !== null && uVal !== undefined ? String(uVal) : '');
          }

          // 6. Average UUC — use value stored by computeBiomedicalAverages when user entered readings
          let avgUucVal = tableInputValues[`${pointId}-averageuuc`];
          if (avgUucVal === undefined || avgUucVal === null || avgUucVal === '') {
            const computed = computeBiomedicalAverages(pointId, 'uuc', 0, '', masterCount, uucCount, tableInputValues);
            avgUucVal = computed.avgUuc || null;
          }
          if (avgUucVal !== null && avgUucVal !== undefined && avgUucVal !== '') {
            calibrationPoints.push(pointId);
            types.push('averageuuc');
            repeatables.push('0');
            values.push(String(avgUucVal));
          }

          // 7. Deviation / Error
          const errorVal = tableInputValues[`${pointId}-error`] ?? row.deviation;
          if (errorVal !== null && errorVal !== undefined && errorVal !== '') {
            calibrationPoints.push(pointId);
            types.push('error');
            repeatables.push('0');
            values.push(String(errorVal));
          }

          // 8. Tolerance / Specification
          const rawTol = tableInputValues[`${pointId}-specification`] ?? row.tolerance ?? row.tolerance_value ?? row.specification ?? '';
          if (rawTol !== null && rawTol !== undefined && rawTol !== '') {
            calibrationPoints.push(pointId);
            types.push('specification');
            repeatables.push('0');
            values.push(String(rawTol));
          }

          // 9. Remark (hidden input type)
          const remarkVal = tableInputValues[`${pointId}-remark`] ?? row.remark ?? '';
          calibrationPoints.push(pointId);
          types.push('remark');
          repeatables.push('0');
          values.push(String(remarkVal));

          // 10. Expanded Uncertainty (hidden input type)
          const uncVal = tableInputValues[`${pointId}-expandeduncertainty`] ?? row.expanded_uncertainty ?? '';
          calibrationPoints.push(pointId);
          types.push('expandeduncertainty');
          repeatables.push('0');
          values.push(String(uncVal));
        });
      }
    }

    if (selectedTableData?.id === 'observationdw') {
      if (formData.pressurestart) {
        calibrationPoints.push(instId);
        types.push('pressure');
        repeatables.push('0');
        values.push(formData.pressurestart);
      }
      if (formData.pressureend) {
        calibrationPoints.push(instId);
        types.push('pressure');
        repeatables.push('1');
        values.push(formData.pressureend);
      }
      if (formData.stabilizationtime) {
        calibrationPoints.push(instId);
        types.push('stabilizationtime');
        repeatables.push('1'); // PHP stores stabilizationtime at repeatable=1
        values.push(formData.stabilizationtime);
      }
    }

    // Build visual_test and basic_safety arrays for biomedical observations
    const isBioObs = selectedTableData?.id === 'observationbiomedical' || isBiomedical;
    const visual_test_source = (selectedTableData?.visual_test && selectedTableData.visual_test.length > 0)
      ? selectedTableData.visual_test
      : visualTests;

    const visual_test = (isBioObs && isVisualTestVisible)
      ? visual_test_source.map((test, index) => {
        const testKey = (test.id !== undefined && test.id !== null) ? test.id : index;
        const rawVal = visualTestInputs[testKey] ?? test.value ?? test.remark ?? '';
        const val = typeof rawVal === 'object' && rawVal !== null ? (rawVal.value ?? '') : String(rawVal);
        return {
          id: test.id ?? index + 1,
          type: test.type || test.test_type || `visualtest${test.id || index + 1}`,
          value: val,
          remark: val,
          description: test.description || test.name || ''
        };
      })
      : [];

    const basic_safety_source = (selectedTableData?.basic_safety && selectedTableData.basic_safety.length > 0)
      ? selectedTableData.basic_safety
      : safetyTests;

    const basic_safety = (isBioObs && isBasicSafetyVisible)
      ? basic_safety_source.map((test, index) => {
        const testKey = (test.id !== undefined && test.id !== null) ? test.id : index;
        const rawVal = safetyTestInputs[testKey] ?? test.value ?? '';
        const val = typeof rawVal === 'object' && rawVal !== null ? (rawVal.value ?? '') : String(rawVal);
        return {
          id: test.id ?? index + 1,
          type: test.type || test.test_type || `electricalsafety${test.id || index + 1}`,
          value: val,
          remark: val,
          description: test.description || test.name || ''
        };
      })
      : [];

    const payloadStep3 = {
      inwardid: inwardId,
      instid: instId,
      caliblocation: caliblocation,
      calibacc: calibacc,
      tempend: formData.tempend,
      humiend: formData.humiend,
      pressurestart: formData.pressurestart,
      pressure_start: formData.pressurestart,
      pressureend: formData.pressureend,
      pressure_end: formData.pressureend,
      stabilizationtime: formData.stabilizationtime,
      stabilization_time: formData.stabilizationtime,
      notes: formData.notes,
      enddate: formData.enddate,
      duedate: formData.duedate,
      daigram: diagram,
      calibrationpoint: calibrationPoints,
      type: types,
      repeatable: repeatables,
      value: values,
      ...(visual_test.length > 0 && { visual_test }),
      ...(basic_safety.length > 0 && { basic_safety }),
    };


    let requestBody = payloadStep3;
    let requestHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    if (selectedTableData?.id === 'observationupload' || observationTemplate === 'observationupload') {
      const formDataUpload = new FormData();
      formDataUpload.append('inwardid', inwardId);
      formDataUpload.append('instid', instId);
      formDataUpload.append('caliblocation', caliblocation);
      formDataUpload.append('calibacc', calibacc);
      formDataUpload.append('ulrno', uploadData?.ulrno || '');
      formDataUpload.append('issuedate', uploadData?.issuedate || formData.enddate || '');
      formDataUpload.append('notes', formData.notes || '');
      formDataUpload.append('enddate', formData.enddate || '');
      formDataUpload.append('duedate', formData.duedate || '');

      if (uploadFile) {
        formDataUpload.append('certificatescanfile', uploadFile);
      }

      requestBody = formDataUpload;
      requestHeaders = {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      await axios.post(
        `${JWT_HOST_API}/calibrationprocess/insert-calibration-step3`,
        requestBody,
        {
          headers: requestHeaders,
        }
      );


      toast.success('All data submitted successfully!');
      setTimeout(() => {
        navigate(
          `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
      }, 1000);
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong while submitting');
    }
  };

  return (
    <Page title="CalibrateStep3">
      <style>{`
        .flatpickr-day.selected,
        .flatpickr-day.startRange,
        .flatpickr-day.endRange,
        .flatpickr-day.selected:hover,
        .flatpickr-day.selected:focus,
        .flatpickr-day.selected.prevMonthDay,
        .flatpickr-day.selected.nextMonthDay {
          background: #2563eb !important;
          border-color: #2563eb !important;
          color: #ffffff !important;
        }
        .flatpickr-day.today {
          border-color: #3b82f6 !important;
        }
        .flatpickr-day.today:hover {
          background: #dbeafe !important;
          color: #1e40af !important;
        }
        .flatpickr-months .flatpickr-prev-month:hover svg,
        .flatpickr-months .flatpickr-next-month:hover svg {
          fill: #2563eb !important;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-medium text-gray-800 dark:text-white">Observation Detail</h1>
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
                      {inwardEntry?.sample_received_on || inwardEntry?.inwarddate || 'N/A'}
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
                          Sr.No
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          I.D No.
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
                              {item.newidno}
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

              {observationTemplate !== 'observationbiomedical' && <div className="mb-6">
                <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2">Support masters</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Reference Standard
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Sr.No
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          I.D No.
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
                              {item.newidno}
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
              </div>}

              {renderThermalCoefficientSection()}

              <div className="mb-6">
                <h2 className="text-md font-medium text-gray-800 dark:text-white mb-4">Observation Detail</h2>
                {observationTemplate && (
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Current Observation Template:</strong> {observationTemplate}
                    </p>
                  </div>
                )}

                {selectedTableData && (tableStructure || selectedTableData.id === 'observationdw' || selectedTableData.id === 'observationwb' || selectedTableData.id === 'observationbiomedical' || selectedTableData.id === 'observationvc' || selectedTableData.id === 'observationapg' || selectedTableData.id === 'observationutm' || selectedTableData.id === 'observationautm' || selectedTableData.id === 'observationvolnl' || selectedTableData.id === 'observationvol' || selectedTableData.id === 'observationvht' || selectedTableData.id === 'observationcustom' || selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationgtm' || selectedTableData.id === 'observationpr' || selectedTableData.id === 'observationupload') && (
                  <div className="space-y-6">
                    {selectedTableData.id === 'observationupload' ? (
                      <ObservationUpload
                        selectedTableData={selectedTableData}
                        uploadData={uploadData}
                        onFileChange={setUploadFile}
                      />
                    ) : selectedTableData.id === 'observationdw' ? (
                      <ObservationDW
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        formData={formData}
                        setFormData={setFormData}
                        observations={observations}
                        isDW={isDW}
                        instId={instId}
                        handleBiomedicalInputChange={handleBiomedicalInputChange}
                        handleBiomedicalInputBlur={handleBiomedicalInputBlur}
                      />
                    ) : selectedTableData.id === 'observationbiomedical' ? (
                      <ObservationBiomedical
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        observations={observations}
                        isBiomedical={isBiomedical}
                        isVisualTestVisible={isVisualTestVisible}
                        isBasicSafetyVisible={isBasicSafetyVisible}
                        isElectricalSafetyVisible={isElectricalSafetyVisible}
                        isPerformanceVisible={isPerformanceVisible}
                        visualTests={visualTests}
                        visualTestInputs={visualTestInputs}
                        setVisualTestInputs={setVisualTestInputs}
                        safetyTests={safetyTests}
                        safetyTestInputs={safetyTestInputs}
                        setSafetyTestInputs={setSafetyTestInputs}
                        handleBiomedicalInputChange={handleBiomedicalInputChange}
                        handleBiomedicalInputBlur={handleBiomedicalInputBlur}
                        validateDecimalPlaces={validateDecimalPlaces}
                        observationErrors={observationErrors}
                        setObservationErrors={setObservationErrors}
                      />
                    ) : selectedTableData.id === 'observationvc' ? (
                      <ObservationVC
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        observations={observations}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        validateDecimalPlaces={validateDecimalPlaces}
                      />
                    ) : selectedTableData.id === 'observationexm' ? (
                      <ObservationEXM
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        observations={observations}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        validateDecimalPlaces={validateDecimalPlaces}
                      />
                    ) : selectedTableData.id === 'observationapg' ? (
                      <ObservationAPG
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        validateDecimalPlaces={validateDecimalPlaces}
                      />
                    ) : selectedTableData.id === 'observationutm' ? (
                      <ObservationUTM
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        validateDecimalPlaces={validateDecimalPlaces}
                        inwardEntry={inwardEntry}
                        instrument={instrument}
                        formData={formData}
                        handleObservationBlur={handleObservationBlur}
                      />
                    ) : selectedTableData.id === 'observationvht' ? (
                      <ObservationVHT
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        handleObservationBlur={handleObservationBlur}
                        observations={observations}
                        instrument={instrument}
                      />
                    ) : selectedTableData.id === 'observationvol' ? (
                      <ObservationVOL
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        validateDecimalPlaces={validateDecimalPlaces}
                        handleObservationBlur={handleObservationBlur}
                        handleBiomedicalInputBlur={handleBiomedicalInputBlur}
                        observations={observations}
                        instId={instId}
                        instrument={instrument}
                        inwardEntry={inwardEntry}
                      />
                    ) : selectedTableData.id === 'observationvolnl' ? (
                      <ObservationVOLNL
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        validateDecimalPlaces={validateDecimalPlaces}
                        handleObservationBlur={handleObservationBlur}
                        handleBiomedicalInputBlur={handleBiomedicalInputBlur}
                        observations={observations}
                        instId={instId}
                        instrument={instrument}
                      />
                    ) : selectedTableData.id === 'observationautm' ? (
                      <ObservationAUTM
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        validateDecimalPlaces={validateDecimalPlaces}
                        inwardEntry={inwardEntry}
                        instrument={instrument}
                        formData={formData}
                        observations={observations}
                        handleObservationBlur={handleObservationBlur}
                      />
                    ) : selectedTableData.id === 'observationcustom' ? (
                      <ObservationCustom
                        selectedTableData={selectedTableData}
                        instrument={getCustomInstrument()}
                        tableInputValues={tableInputValues}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        observationErrors={observationErrors}
                        observations={observations}
                      />
                    ) : selectedTableData.id === 'observationwbn' ? (
                      <ObservationWBN
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        validateDecimalPlaces={validateDecimalPlaces}
                        observationErrors={observationErrors}
                        setObservationErrors={setObservationErrors}
                        observations={observations}
                        diagram={diagram}
                        setDiagram={setDiagram}
                      />
                    ) : selectedTableData.id === 'observationwb' ? (
                      <ObservationWB
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        observationErrors={observationErrors}
                        observations={observations}
                        diagram={diagram}
                        setDiagram={setDiagram}
                      />
                    ) : selectedTableData.id === 'observationgtm' ? (
                      <ObservationGTM
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        observations={observations}
                        instrument={instrument}
                        unitsList={unitsList}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        validateDecimalPlaces={validateDecimalPlaces}
                      />

                    ) : selectedTableData.id === 'observationpr' ? (
                      <ObservationPR
                        selectedTableData={selectedTableData}
                        tableInputValues={tableInputValues}
                        setTableInputValues={setTableInputValues}
                        observations={observations}
                        instrument={instrument}
                        inwardEntry={inwardEntry}
                        formData={formData}
                        unitsList={unitsList}
                        handleInputChange={handleInputChange}
                        handleObservationBlur={handleObservationBlur}
                        validateDecimalPlaces={validateDecimalPlaces}
                      />
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

                                          const isObs45Disabled = false; // Observation 4 and 5 are always editable for MM
                                          const isDisabled =
                                            colIndex === 0 || // SR No
                                            colIndex === 1 || // Mode
                                            colIndex === 3 || // Calculated master (read-only)
                                            colIndex === 4 || // Master value (read-only)
                                            colIndex === 10 || // Average
                                            colIndex === 11 || // Error
                                            isObs45Disabled;

                                          return (
                                            <td
                                              key={colIndex}
                                              className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                                            >
                                              <input
                                                type="text"
                                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent ${isObs45Disabled
                                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed select-none'
                                                  : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
                                                  } ${isDisabled && !isObs45Disabled ? 'cursor-not-allowed' : ''} ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                                value={currentValue}
                                                onChange={(e) => {
                                                  if (isDisabled) return;
                                                  // Range (col 2) is free text, e.g. "0-200 V"
                                                  handleInputChange(actualRowIndex, colIndex, e.target.value, colIndex === 2 ? 'text' : 'numeric');
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
                                    let currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                                    // Apply least_count formatting to average and error columns
                                    const point = observations?.[rowIndex];
                                    const calibPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[rowIndex];
                                    const lcInfo = leastCountData[calibPointId] || leastCountData[String(calibPointId)];

                                    if (selectedTableData?.id === 'observationmt') {
                                      const masterLc = (typeof lcInfo === 'object' ? (lcInfo?.masterStr ?? lcInfo?.master) : null) ?? point?.metadata?.master_least_count ?? point?.master_least_count ?? 0.005;
                                      const masterDecimals = (typeof lcInfo === 'object' ? lcInfo?.master_decimals : null) ?? point?.metadata?.master_decimal_places ?? getDecimalPlaces(masterLc);

                                      if (colIndex === 7 || colIndex === 8) {
                                        currentValue = formatValueByLc(currentValue, masterDecimals, masterLc);
                                      }
                                    } else if (point && (point.least_count || point.master_least_count)) {
                                      const effectiveLc = (point.least_count && point.least_count !== 'NA' && point.least_count !== 'N.A')
                                        ? point.least_count
                                        : (point.master_least_count || point.least_count);

                                      // observationexm, observationvc, observationctg, observationmsr: Average at colIndex 7, Error at colIndex 8
                                      if (['observationexm', 'observationvc', 'observationctg', 'observationmsr'].includes(selectedTableData?.id) && (colIndex === 7 || colIndex === 8)) {
                                        const lc_decimals = getDecimalPlaces(effectiveLc);
                                        currentValue = formatValueByLc(currentValue, lc_decimals, effectiveLc);
                                      }
                                      // observationfg, observationhg: Average at colIndex 7, Error at colIndex 8
                                      else if (['observationfg', 'observationhg'].includes(selectedTableData?.id) && (colIndex === 7 || colIndex === 8)) {
                                        const lc_decimals = getDecimalPlaces(effectiveLc);
                                        currentValue = formatValueByLc(currentValue, lc_decimals, effectiveLc);
                                      }
                                      // observationit: Average at colIndex 7, Error at colIndex 8
                                      else if (selectedTableData?.id === 'observationit' && (colIndex === 7 || colIndex === 8)) {
                                        const lc_decimals = getDecimalPlaces(effectiveLc);
                                        currentValue = formatValueByLc(currentValue, lc_decimals, effectiveLc);
                                      }
                                    }

                                    // SUTM: all cells handled here (only displacement and time are typed)
                                    if (selectedTableData.id === 'observationsutm') {
                                      const tdClass = 'px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 align-middle';
                                      if (colIndex === SUTM_COLS.SR_NO) {
                                        return (
                                          <td key={colIndex} className={`${tdClass} text-center font-medium`}>
                                            {cell}
                                          </td>
                                        );
                                      }

                                      const isEditable = isSUTMCellEditable(colIndex);
                                      return (
                                        <td key={colIndex} className={tdClass}>
                                          <input
                                            type="text"
                                            className={`w-full min-w-[70px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isEditable ? '' : 'cursor-not-allowed'} ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                            value={currentValue}
                                            onChange={(e) => {
                                              if (!isEditable) return;
                                              handleInputChange(rowIndex, colIndex, e.target.value);
                                            }}
                                            onBlur={(e) => {
                                              if (!isEditable) return;
                                              handleObservationBlur(rowIndex, colIndex, e.target.value);
                                            }}
                                            disabled={!isEditable}
                                          />
                                          {observationErrors[key] && (
                                            <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                          )}
                                        </td>
                                      );
                                    }

                                    // SW: all cells handled here (paired UUC/Master rows, rowspans)
                                    if (selectedTableData.id === 'observationsw') {
                                      const rowType = getSWRowType(row);
                                      const spansBothRows = selectedTableData.rowSpanColumns?.includes(colIndex);
                                      // Sr. No., Set Value, Error and Uncertainty are merged into the UUC row (PHP rowspan="2")
                                      if (spansBothRows && rowType !== 'uuc') return null;
                                      const tdProps = {
                                        rowSpan: spansBothRows ? 2 : undefined,
                                        className: 'px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 align-middle',
                                      };

                                      if (colIndex === SW_COLS.SR_NO || colIndex === SW_COLS.VALUE_OF || cell === '-') {
                                        return (
                                          <td key={colIndex} {...tdProps} className={`${tdProps.className} text-center font-medium`}>
                                            {cell}
                                          </td>
                                        );
                                      }

                                      const isEditable = isSWCellEditable(rowType, colIndex);
                                      // Uncertainty is free text in PHP; everything else numeric
                                      const fieldType = colIndex === SW_COLS.UNCERTAINTY ? 'text' : 'numeric';
                                      return (
                                        <td key={colIndex} {...tdProps}>
                                          <input
                                            type="text"
                                            className={`w-full min-w-[70px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isEditable ? '' : 'cursor-not-allowed'} ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                            value={currentValue}
                                            onChange={(e) => {
                                              if (!isEditable) return;
                                              handleInputChange(rowIndex, colIndex, e.target.value, fieldType);
                                            }}
                                            onBlur={(e) => {
                                              if (!isEditable) return;
                                              handleObservationBlur(rowIndex, colIndex, e.target.value);
                                            }}
                                            disabled={!isEditable}
                                          />
                                          {observationErrors[key] && (
                                            <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                          )}
                                        </td>
                                      );
                                    }

                                    // TSWI: all cells handled here (paired UUC/Master rows, master unit select, rowspans)
                                    if (selectedTableData.id === 'observationtswi') {
                                      const rowType = getTSWIRowType(row);
                                      const spansBothRows = selectedTableData.rowSpanColumns?.includes(colIndex);
                                      // Sr. No., Set Point and Deviation are merged into the UUC row (PHP rowspan="2")
                                      if (spansBothRows && rowType !== 'uuc') return null;
                                      const tdProps = {
                                        rowSpan: spansBothRows ? 2 : undefined,
                                        className: 'px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 align-middle',
                                      };

                                      if (colIndex === TSWI_COLS.UNIT && rowType === 'master') {
                                        return (
                                          <td key={colIndex} {...tdProps}>
                                            <Select
                                              options={unitsList}
                                              className="w-full min-w-[140px] text-sm"
                                              classNamePrefix="select"
                                              placeholder="Select unit..."
                                              value={unitsList.find(u => String(u.value) === String(currentValue) || u.label === currentValue) || null}
                                              styles={{
                                                control: (base) => ({
                                                  ...base,
                                                  minHeight: '32px',
                                                  fontSize: '0.875rem'
                                                })
                                              }}
                                              onChange={(selected) => {
                                                // PHP stores the unit id
                                                const unitId = selected?.value?.toString() || '';
                                                handleInputChange(rowIndex, colIndex, unitId, 'text');
                                                handleObservationBlur(rowIndex, colIndex, unitId);
                                              }}
                                            />
                                          </td>
                                        );
                                      }

                                      // UUC unit is printed as text in PHP
                                      if (colIndex === TSWI_COLS.SR_NO || colIndex === TSWI_COLS.VALUE_OF || colIndex === TSWI_COLS.UNIT || cell === '-') {
                                        return (
                                          <td key={colIndex} {...tdProps} className={`${tdProps.className} text-center font-medium`}>
                                            {cell}
                                          </td>
                                        );
                                      }

                                      const isEditable = isTSWICellEditable(rowType, colIndex);
                                      return (
                                        <td key={colIndex} {...tdProps}>
                                          <input
                                            type="text"
                                            className={`w-full min-w-[70px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isEditable ? '' : 'cursor-not-allowed'} ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                            value={currentValue}
                                            onChange={(e) => {
                                              if (!isEditable) return;
                                              handleInputChange(rowIndex, colIndex, e.target.value);
                                            }}
                                            onBlur={(e) => {
                                              if (!isEditable) return;
                                              handleObservationBlur(rowIndex, colIndex, e.target.value);
                                            }}
                                            disabled={!isEditable}
                                          />
                                          {observationErrors[key] && (
                                            <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                          )}
                                        </td>
                                      );
                                    }

                                    // TSWOI: all cells handled here (paired UUC/Master rows, unit selects, rowspans)
                                    if (selectedTableData.id === 'observationtswoi') {
                                      const rowType = getTSWOIRowType(row);
                                      const spansBothRows = selectedTableData.rowSpanColumns?.includes(colIndex);
                                      // Sr. No., Set Point and Deviation are merged into the UUC row (PHP rowspan="2")
                                      if (spansBothRows && rowType !== 'uuc') return null;
                                      const tdProps = {
                                        rowSpan: spansBothRows ? 2 : undefined,
                                        className: 'px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 align-middle',
                                      };

                                      if (colIndex === TSWOI_COLS.UNIT) {
                                        return (
                                          <td key={colIndex} {...tdProps}>
                                            <Select
                                              options={unitsList}
                                              className="w-full min-w-[140px] text-sm"
                                              classNamePrefix="select"
                                              placeholder="Select unit..."
                                              value={unitsList.find(u => String(u.value) === String(currentValue) || u.label === currentValue) || null}
                                              styles={{
                                                control: (base) => ({
                                                  ...base,
                                                  minHeight: '32px',
                                                  fontSize: '0.875rem'
                                                })
                                              }}
                                              onChange={(selected) => {
                                                // PHP stores the unit id
                                                const unitId = selected?.value?.toString() || '';
                                                handleInputChange(rowIndex, colIndex, unitId, 'text');
                                                handleObservationBlur(rowIndex, colIndex, unitId);
                                              }}
                                            />
                                          </td>
                                        );
                                      }

                                      if (colIndex === TSWOI_COLS.SR_NO || colIndex === TSWOI_COLS.VALUE_OF || cell === '-') {
                                        return (
                                          <td key={colIndex} {...tdProps} className={`${tdProps.className} text-center font-medium`}>
                                            {cell}
                                          </td>
                                        );
                                      }

                                      const isEditable = isTSWOICellEditable(rowType, colIndex);
                                      return (
                                        <td key={colIndex} {...tdProps}>
                                          <input
                                            type="text"
                                            className={`w-full min-w-[70px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isEditable ? '' : 'cursor-not-allowed'} ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                            value={currentValue}
                                            onChange={(e) => {
                                              if (!isEditable) return;
                                              handleInputChange(rowIndex, colIndex, e.target.value);
                                            }}
                                            onBlur={(e) => {
                                              if (!isEditable) return;
                                              handleObservationBlur(rowIndex, colIndex, e.target.value);
                                            }}
                                            disabled={!isEditable}
                                          />
                                          {observationErrors[key] && (
                                            <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                          )}
                                        </td>
                                      );
                                    }

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
                                    const totalRowsCount = selectedTableData.staticRows?.length || 1;
                                    const isLastRow = rowIndex === totalRowsCount - 1;
                                    const isLastTwoRows = rowIndex >= totalRowsCount - 2;

                                    let isObs45Disabled = false;
                                    if (selectedTableData.id === 'observationmt') {
                                      const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex], 10) || 5;
                                      isObs45Disabled = (colIndex >= 2 && colIndex <= 6 && colIndex >= 2 + repeatableCycle);
                                    } else if (['observationctg', 'observationmsr', 'observationexm', 'observationvc', 'observationfg', 'observationhg'].includes(selectedTableData.id)) {
                                      isObs45Disabled = !isLastRow && (colIndex === 5 || colIndex === 6);
                                    } else if (selectedTableData.id === 'observationes') {
                                      isObs45Disabled = !isLastRow && (colIndex === 8 || colIndex === 9);
                                    } else if (selectedTableData.id === 'observationgtm') {
                                      isObs45Disabled = !isLastTwoRows && (colIndex === 9 || colIndex === 10);
                                    } else if (['observationrtdwi'].includes(selectedTableData.id)) {
                                      isObs45Disabled = !isLastTwoRows && (colIndex === 8 || colIndex === 9);
                                    }

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
                                        isDisabled = isDisabled || [0, 1, 2, 4, 5, 11, 12, 13].includes(colIndex);
                                      }
                                      if (rowType === 'Master') {
                                        isDisabled = isDisabled || [0, 1, 2, 3, 11, 13].includes(colIndex);
                                      }
                                    }

                                    else if (selectedTableData.id === 'observationdg') {
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
                                    } else if (selectedTableData.id === 'observationexm' || selectedTableData.id === 'observationvc') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationfg') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationhg') {
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationmt') {
                                      const repeatableCycle = parseInt(selectedTableData.hiddenInputs?.repeatables?.[rowIndex], 10) || 5;
                                      isDisabled = isDisabled || [1, 7, 8].includes(colIndex) || (colIndex >= 2 && colIndex <= 6 && colIndex >= 2 + repeatableCycle);
                                    } else if (selectedTableData.id === 'observationmm') {
                                      isDisabled = isDisabled || [0, 1, 3, 4, 10, 11].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationuc') {
                                      isDisabled = isDisabled || [0, 3, 4, 10, 11].includes(colIndex);
                                    } else if (selectedTableData.id === 'observationes') {
                                      isDisabled = isDisabled || [0, 1, 10, 11, 12].includes(colIndex);
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
                                    } else if (selectedTableData.id === 'observationcustom') {
                                      const layout = getCustomLayoutIndices(instrument);
                                      if (layout) {
                                        const disabledCols = [0];
                                        if (layout.avgMasterIdx !== -1) disabledCols.push(layout.avgMasterIdx);
                                        if (layout.avgUucIdx !== -1) disabledCols.push(layout.avgUucIdx);
                                        if (layout.errorIdx !== -1) disabledCols.push(layout.errorIdx);
                                        isDisabled = isDisabled || disabledCols.includes(colIndex);
                                      }
                                    }

                                    if (isObs45Disabled) {
                                      isDisabled = true;
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
                                          className={`w-full min-w-[50px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent ${isObs45Disabled
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed select-none'
                                            : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
                                            } ${isDisabled && !isObs45Disabled ? 'cursor-not-allowed' : ''} ${observationErrors[key] ? 'border-red-500' : ''}`}
                                          value={currentValue}
                                          onChange={(e) => {
                                            if (isDisabled) return;
                                            const fieldType = ((selectedTableData.id === 'observationth' && colIndex === 2) || (selectedTableData.id === 'observationodfm' && colIndex === 1) || (selectedTableData.id === 'observationuc' && colIndex === 2) || (selectedTableData.id === 'observationmm' && colIndex === 2)) ? 'text' : 'numeric';
                                            handleInputChange(rowIndex, colIndex, e.target.value, fieldType);
                                            if (
                                              observationErrors[key] &&
                                              selectedTableData.id !== 'observationmm' &&
                                              selectedTableData.id !== 'observationctg' &&
                                              selectedTableData.id !== 'observationexm' &&
                                              selectedTableData.id !== 'observationcustom' &&
                                              selectedTableData.id !== 'observationts' &&
                                              selectedTableData.id !== 'observationmt'
                                            ) {
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
                                              selectedTableData.id === 'observationrtdwi' ||
                                              selectedTableData.id === 'observationcustom') {
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

                {observationTemplate && observations.length === 0 && !isVisualTestVisible && !isBasicSafetyVisible && (
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

              {/* Parallelism Section for Observation VC */}
              {selectedTableData?.id === 'observationvc' && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Parallelism</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Parallelism of external jaws (&micro;m):
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={parallelism.parallexternal}
                            onChange={(e) => setParallelism((prev) => ({ ...prev, parallexternal: e.target.value }))}
                            onBlur={(e) => handleParallelismBlur('parallexternal', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                            placeholder="Enter parallelism of external jaws"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">µm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Parallelism Of Internal Jaws (&micro;m):
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={parallelism.parallinternal}
                            onChange={(e) => setParallelism((prev) => ({ ...prev, parallinternal: e.target.value }))}
                            onBlur={(e) => handleParallelismBlur('parallinternal', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                            placeholder="Enter parallelism of internal jaws"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">µm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Calibration End Date/Done date:
                  </label>
                  <Flatpickr
                    name="enddate"
                    value={formData.enddate}
                    onChange={(_, dateStr) => {
                      const calculatedDue = calculateDueDate(dateStr, instrument?.calibrationvalidity);
                      setFormData(prev => ({
                        ...prev,
                        enddate: dateStr,
                        ...(calculatedDue ? { duedate: calculatedDue } : {})
                      }));
                    }}
                    options={{
                      enableTime: true,
                      time_24hr: true,
                      enableSeconds: true,
                      dateFormat: "Y-m-d H:i:S",
                      altInput: true,
                      altFormat: "d/m/Y H:i:S",
                      altInputClass: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white",
                      allowInput: true
                    }}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Suggested Due Date:
                  </label>
                  <Flatpickr
                    name="duedate"
                    value={formData.duedate}
                    onChange={(_, dateStr) => {
                      setFormData(prev => ({
                        ...prev,
                        duedate: dateStr
                      }));
                    }}
                    options={{
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "d/m/Y",
                      altInputClass: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white",
                      allowInput: true
                    }}
                    className="hidden"
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
