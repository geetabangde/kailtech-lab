import {
  safeGetValue,
  safeGetArray,
  formatValueByLc,
  getObservationValueByType,
  normalizeUtmGroups,
  applyTemperatureCompensation,
} from './viewRawDataUtils';

export * from './viewRawDataUtils';
export { BiomedicalTable } from './BiomedicalTable';
export { UCTable } from './UCTable';
export { TMTable } from './TMTable';
export { WeighingBalanceTable } from './WeighingBalanceTable';
export { TSTable } from './TSTable';

// Modular Observation Imports
import { dpgTableConfig, createDPGRows, parseDPGDynamicData } from './ViewObservationDPG';
import { thTableConfig, createTHRows } from './ViewObservationTH';
import { mtTableConfig, createMTRows, parseMTDynamicData } from './ViewObservationMT';
import { ctgTableConfig, createCTGRows, parseCTGDynamicData } from './ViewObservationCTG';
import { fgTableConfig, createFGRows, parseFGDynamicData } from './ViewObservationFG';
import { msrTableConfig, createMSRRows, parseMSRDynamicData } from './ViewObservationMSR';
import { hgTableConfig, createHGRows, parseHGDynamicData } from './ViewObservationHG';
import { itTableConfig, createITRows, parseITDynamicData } from './ViewObservationIT';
import { tmTableConfig, createTMRows, parseTMDynamicData } from './ViewObservationTM';
import { ucTableConfig, createUCRows, parseUCDynamicData } from './ViewObservationUC';
import { mmTableConfig, createMMRows, parseMMDynamicData } from './ViewObservationMM';
import { rtdwiTableConfig, createRTDWIRows, parseRTDWIDynamicData } from './ViewObservationRTDWI';
import { tswoiTableConfig, createTSWOIViewRows, parseTSWOIDynamicData, TSWOI_ROWSPAN_COLUMNS } from './ViewObservationTSWOI';
import { rtdwoiTableConfig, createRTDWOIViewRows, parseRTDWOIDynamicData, RTDWOI_ROWSPAN_COLUMNS } from './ViewObservationRTDWOI';
import { tswiTableConfig, createTSWIViewRows, parseTSWIDynamicData, TSWI_ROWSPAN_COLUMNS } from './ViewObservationTSWI';
import { swTableConfig, createSWViewRows, parseSWDynamicData, SW_ROWSPAN_COLUMNS } from './ViewObservationSW';
import { apgTableConfig, createAPGRows, parseAPGDynamicData } from './ViewObservationAPG';
import { dwTableConfig, createDWRows, parseDWDynamicData } from './ViewObservationDW';
import { tsTableConfig, createTSRows, parseTSDynamicData } from './ViewObservationTS';
import { wbTableConfig, wbnTableConfig, createWBRows, parseWBDynamicData } from './ViewObservationWB';
import { ViewObservationWBN } from './ViewObservationWBN';
import { dgTableConfig, createDGRows, parseDGDynamicData } from './ViewObservationDG';
import { biomedicalTableConfig, createBiomedicalRows, parseBiomedicalDynamicData } from './ViewObservationBiomedical';
import { getObservationCustomStructure, createCustomRows, parseCustomDynamicData } from './ViewObservationCustom';
import { gtmTableConfig, createGTMRows, parseGTMDynamicData } from './ViewObservationGTM';
import { ViewObservationAUTM, autmTableConfig, createAUTMRows, parseAUTMDynamicData } from './ViewObservationAUTM';
import { prTableConfig, createPRRows, ViewObservationPR } from './ViewObservationPR';
import { ViewObservationUTM } from './ViewObservationUTM';

export {
  dpgTableConfig, createDPGRows,
  thTableConfig, createTHRows,
  mtTableConfig, createMTRows,
  ctgTableConfig, createCTGRows,
  fgTableConfig, createFGRows,
  msrTableConfig, createMSRRows,
  hgTableConfig, createHGRows,
  itTableConfig, createITRows,
  tmTableConfig, createTMRows,
  ucTableConfig, createUCRows,
  mmTableConfig, createMMRows,
  rtdwiTableConfig, createRTDWIRows,
  tswoiTableConfig, createTSWOIViewRows, parseTSWOIDynamicData, TSWOI_ROWSPAN_COLUMNS,
  rtdwoiTableConfig, createRTDWOIViewRows, parseRTDWOIDynamicData, RTDWOI_ROWSPAN_COLUMNS,
  tswiTableConfig, createTSWIViewRows, parseTSWIDynamicData, TSWI_ROWSPAN_COLUMNS,
  swTableConfig, createSWViewRows, parseSWDynamicData, SW_ROWSPAN_COLUMNS,
  apgTableConfig, createAPGRows,
  dwTableConfig, createDWRows,
  dgTableConfig, createDGRows, parseDGDynamicData,
  tsTableConfig, createTSRows,
  wbTableConfig, wbnTableConfig, createWBRows, ViewObservationWBN,
  biomedicalTableConfig, createBiomedicalRows,
  getObservationCustomStructure, createCustomRows,
  gtmTableConfig, createGTMRows, parseGTMDynamicData,
  ViewObservationAUTM, autmTableConfig, createAUTMRows, parseAUTMDynamicData,
  prTableConfig, createPRRows, ViewObservationPR,
  ViewObservationUTM,
};

/**
 * Returns complete list of observation table structures for ViewRawData
 */
export const getViewObservationTables = (rawdata) => [
  biomedicalTableConfig,
  {
    id: 'observationcustom',
    name: 'Observation Custom',
    category: 'Custom',
    structure: getObservationCustomStructure(rawdata?.listInstrument),
  },
  thTableConfig,
  wbnTableConfig,
  {
    id: 'observationwwbn',
    name: 'Observation WWBN (Uncertainty)',
    category: 'Weighing Balance',
    structure: {
      singleHeaders: ['Sr No'],
      subHeaders: {
        'Readings': ['1', '2', '3', '4', '5'],
        'Type A Factor': ['Unit', 'Calibration point', 'Average(g)', 'Std Deviation', 'Type A'],
        'Type B Factor': ['Drift in mass(g)', 'Eccentricity (g)', 'Uncertainty of master (g)', 'Least Count (g)'],
        'Uncertainty Measurement': [
          'Combined Uncertainty',
          'Degree of Freedom',
          'Coverage Factor (k)',
          'Expanded Uncertainty (g)',
          'Expanded Uncertainty (mg)',
          'CMC Taken',
        ],
      },
      remainingHeaders: [],
    },
  },
  dwTableConfig,
  dpgTableConfig,
  ucTableConfig,
  {
    id: 'observationppg',
    name: 'Observation PPG',
    category: 'Pressure',
    structure: {
      singleHeaders: [
        'SR NO',
        'SET PRESSURE ON UUC (CALCULATIONUNIT)',
        'SET PRESSURE ON UUC (MASTERUNIT)',
      ],
      subHeaders: {
        'OBSERVATION ON MASTER (MASTERUNIT)': ['M1 (↑)', 'M2 (↓)', 'M3 (↑)', 'M4 (↓)', 'M5 (↑)', 'M6 (↓)'],
      },
      remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
    },
  },
  {
    id: 'observationavg',
    name: 'Observation AVG',
    category: 'Pressure',
    structure: {
      singleHeaders: [
        'Sr no',
        'Set Pressure on UUC (UUC Unit)',
        '[Set Pressure on UUC (Master Unit)]',
      ],
      subHeaders: {
        'Observation on Master': ['M1', 'M2'],
      },
      remainingHeaders: [
        'Mean (Master Unit)',
        'Error (Master Unit)',
        'Hysteresis (Master Unit)',
      ],
    },
  },
  {
    id: 'observationexm',
    name: 'Observation EXM',
    category: 'External Micrometer',
    structure: {
      thermalCoeff: true,
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
      subHeaders: {
        'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'],
      },
      remainingHeaders: ['Average', 'Error'],
    },
  },
  mmTableConfig,
  {
    id: 'observationes',
    name: 'Observation ES',
    category: 'Medical/Electrical Safety',
    structure: {
      singleHeaders: ['Sr. No.', 'Mode', 'Parameter', 'Set Point', 'Reading (UUC/Master)'],
      subHeaders: {
        'Readings (Master/UUC)': ['Reading 1', 'Reading 2', 'Reading 3', 'Reading 4', 'Reading 5'],
      },
      remainingHeaders: ['Average', 'Error', 'Tolerance'],
    },
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
      remainingHeaders: ['Average (Master Unit)', 'Error (Master Unit)'],
    },
  },
  apgTableConfig,
  ctgTableConfig,
  {
    id: 'observationvc',
    name: 'Observation VC',
    category: 'Vernier Caliper',
    structure: {
      isMatrix: true,
      thermalCoeff: true,
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
      subHeaders: {
        'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'],
      },
      remainingHeaders: ['Average', 'Error'],
    },
  },
  itTableConfig,
  mtTableConfig,
  {
    id: 'observationmg',
    name: 'Observation MG',
    category: 'Manometer',
    structure: {
      singleHeaders: [
        'Sr no',
        'Set Pressure on UUC ([unit])',
        '[Set Pressure on UUC ([master unit])]',
      ],
      subHeaders: {
        'Observation on UUC': ['M1', 'M2'],
      },
      remainingHeaders: [
        'Mean ([master unit])',
        'Error ([master unit])',
        'Hysterisis ([master unit])',
      ],
    },
  },
  fgTableConfig,
  hgTableConfig,
  rtdwiTableConfig,
  tswoiTableConfig,
  rtdwoiTableConfig,
  tswiTableConfig,
  msrTableConfig,
  tmTableConfig,
  gtmTableConfig,
  {
    id: 'observationutm',
    name: 'Observation UTM',
    category: 'Force',
    structure: {
      singleHeaders: [
        'Sr. No.',
        'Force (F)',
        'Std. at 23/24 +/-1 C',
        'Std. at Room Temp (C)',
      ],
      subHeaders: {
        'Observed (F)': ['Position 0° / Obs 1', 'Position 120° / Obs 2', 'Position 240° / Obs 3'],
      },
      remainingHeaders: ['Mean (Fi)', 'Error (q)', '% Error (q)', '% Repeatability Error (q)'],
    },
  },
  autmTableConfig,
  dgTableConfig,
  prTableConfig,
  tsTableConfig,
  swTableConfig,
  wbTableConfig,
];

/**
 * Dispatches row generation for any observation template
 */
export const createViewObservationRows = (observationData, template, currentRawdata = {}) => {
  if (!observationData) return { rows: [], matrixGroups: [], unitTypes: [], modes: [] };

  let dataArray = [];
  let matrixGroups = [];
  let unitTypes = [];
  let modes = [];

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

  let rows = [];
  const hiddenInputs = {
    values: [],
    calibrationPoints: [],
    repeatables: [],
  };

  let weighingCount = 0;
  let repeatabilityCount = 0;
  let eccentricityCount = 0;

  if (template === 'observationbiomedical') {
    rows = createBiomedicalRows(dataArray);
  } else if (template === 'observationcustom') {
    rows = createCustomRows(dataArray, currentRawdata, observationData);
  } else if (template === 'observationwbn' || template === 'observationwb') {
    const wbRes = createWBRows(dataArray);
    rows = wbRes.rows;
    weighingCount = wbRes.weighingCount;
    repeatabilityCount = wbRes.repeatabilityCount;
    eccentricityCount = wbRes.eccentricityCount;
    return {
      rows,
      matrixGroups: [],
      unitTypes: [],
      modes: [],
      weighingCount,
      repeatabilityCount,
      eccentricityCount,
    };
  } else if (template === 'observationdpg') {
    rows = createDPGRows(dataArray, currentRawdata);
  } else if (template === 'observationth') {
    rows = createTHRows(dataArray);
  } else if (template === 'observationmt') {
    rows = createMTRows(dataArray);
  } else if (template === 'observationctg') {
    rows = createCTGRows(dataArray);
  } else if (template === 'observationfg') {
    rows = createFGRows(dataArray);
  } else if (template === 'observationmsr') {
    rows = createMSRRows(dataArray);
  } else if (template === 'observationhg') {
    rows = createHGRows(dataArray);
  } else if (template === 'observationit') {
    rows = createITRows(dataArray);
  } else if (template === 'observationtm') {
    rows = createTMRows(dataArray);
  } else if (template === 'observationuc') {
    const ucRes = createUCRows(dataArray);
    rows = ucRes.rows;
    modes = ucRes.modes;
  } else if (template === 'observationmm') {
    const mmRes = createMMRows(dataArray);
    rows = mmRes.rows;
    unitTypes = mmRes.unitTypes;
  } else if (template === 'observationrtdwi') {
    rows = createRTDWIRows(dataArray);
  } else if (template === 'observationtswoi') {
    rows = createTSWOIViewRows(dataArray);
  } else if (template === 'observationrtdwoi') {
    rows = createRTDWOIViewRows(dataArray);
  } else if (template === 'observationtswi') {
    rows = createTSWIViewRows(dataArray);
  } else if (template === 'observationapg') {
    rows = createAPGRows(dataArray);
  } else if (template === 'observationdw') {
    rows = createDWRows(dataArray);
  } else if (template === 'observationts') {
    rows = createTSRows(dataArray, hiddenInputs);
  } else if (template === 'observationwwbn') {
    dataArray.forEach((point) => {
      if (!point) return;
      const readings = safeGetArray(point.observations || point.uuc_values, 5);
      while (readings.length < 5) readings.push('');

      const row = [
        point.sr_no?.toString() || '',
        ...readings.slice(0, 5).map((val) => safeGetValue(val)),
        safeGetValue(point.unit),
        safeGetValue(point.point || point.calibration_point),
        safeGetValue(point.average || point.averageuuc),
        safeGetValue(point.repeatability || point.std_deviation),
        safeGetValue(point.typea || point.type_a),
        safeGetValue(point.drift),
        safeGetValue(point.eccentricityfactor || point.eccentricity),
        safeGetValue(point.masterunc || point.master_uncertainty),
        safeGetValue(point.leastcount || point.least_count),
        safeGetValue(point.comuncer || point.combined_uncertainty),
        safeGetValue(point.dof || point.degree_of_freedom),
        safeGetValue(point.coveragefactor || point.coverage_factor),
        safeGetValue(point.expandeduncertainty || point.expanded_uncertainty),
        safeGetValue(point.expandeduncertaintymg || point.expanded_uncertainty_mg),
        safeGetValue(point.cmcuncertainty || point.cmc_taken),
      ];

      while (row.length < 21) row.push('');
      rows.push(row);
    });
  } else if (template === 'observationppg') {
    dataArray.forEach((obs) => {
      if (!obs) return;

      const uucLc = obs?.least_counts?.uuc ?? obs?.least_count_uuc ?? obs?.uuc_least_count ?? obs?.least_count ?? obs?.leastcount ?? currentRawdata?.uuc_details?.least_count;
      const masterLc = obs?.least_counts?.master ?? obs?.least_count_master ?? obs?.master_least_count ?? obs?.masterleastcount;

      const m1Str = safeGetValue(obs.master_readings?.m1 ?? obs.master_readings?.[0] ?? obs.m1);
      let mlc = null;
      if (masterLc) {
        const match = String(masterLc).match(/\.([0-9]+)/);
        if (match) mlc = match[1].length;
        else if (!isNaN(parseFloat(masterLc))) mlc = 0;
      }
      if (mlc === null && m1Str.includes('.')) {
        mlc = m1Str.split('.')[1].length;
      }
      if (mlc === null) mlc = 3;

      let uucDecimals = null;
      if (uucLc) {
        const match = String(uucLc).match(/\.([0-9]+)/);
        if (match) uucDecimals = match[1].length;
        else if (!isNaN(parseFloat(uucLc))) uucDecimals = 0;
      }
      if (uucDecimals === null) {
        const uucStr = safeGetValue(obs.uuc_value ?? obs.set_pressure_uuc);
        if (uucStr.includes('.')) uucDecimals = uucStr.split('.')[1].length;
        else uucDecimals = 1;
      }

      const errorDecimals = Math.max(mlc, uucDecimals);

      const row = [
        obs.sr_no?.toString() || '',
        formatValueByLc(obs.uuc_value ?? obs.set_pressure_uuc, uucDecimals, uucLc),
        formatValueByLc(obs.converted_uuc_value ?? obs.set_pressure_master, mlc, masterLc),
        formatValueByLc(obs.master_readings?.m1 ?? obs.master_readings?.[0] ?? obs.m1, mlc, masterLc),
        formatValueByLc(obs.master_readings?.m2 ?? obs.master_readings?.[1] ?? obs.m2, mlc, masterLc),
        formatValueByLc(obs.master_readings?.m3 ?? obs.master_readings?.[2] ?? obs.m3, mlc, masterLc),
        formatValueByLc(obs.master_readings?.m4 ?? obs.master_readings?.[3] ?? obs.m4, mlc, masterLc),
        formatValueByLc(obs.master_readings?.m5 ?? obs.master_readings?.[4] ?? obs.m5, mlc, masterLc),
        formatValueByLc(obs.master_readings?.m6 ?? obs.master_readings?.[5] ?? obs.m6, mlc, masterLc),
        formatValueByLc(obs.average_master ?? obs.average ?? obs.mean, mlc, masterLc),
        formatValueByLc(obs.error, errorDecimals, masterLc),
        formatValueByLc(obs.repeatability ?? obs.repeatable, mlc, masterLc),
        formatValueByLc(obs.hysterisis ?? obs.hysteresis, mlc, masterLc),
      ];
      rows.push(row);
    });
  } else if (template === 'observationavg') {
    dataArray.forEach((point) => {
      if (!point) return;
      const lc = point.least_count || point.least_count_uuc || point.leastcount || '0.1';
      const row = [
        point.sr_no?.toString() || '',
        formatValueByLc(point.set_point_uuc, null, lc),
        formatValueByLc(point.calculated_uuc, null, lc),
        formatValueByLc(point.master_readings?.[0], null, lc),
        formatValueByLc(point.master_readings?.[1], null, lc),
        formatValueByLc(point.average_master, null, lc),
        formatValueByLc(point.error, null, lc),
        formatValueByLc(point.hysteresis, null, lc),
      ];
      rows.push(row);
    });
  } else if (template === 'observationexm') {
    dataArray.forEach((point) => {
      if (!point) return;
      const observations = safeGetArray(point.observations, 5);
      const lc = point.least_count || point.least_count_uuc || point.leastcount || '0.01';

      while (observations.length < 5) {
        observations.push('');
      }

      const row = [
        point.sr_no?.toString() || '',
        safeGetValue(point.nominal_value || point.test_point),
        ...observations.slice(0, 5).map((obs) => formatValueByLc(obs, null, lc)),
        formatValueByLc(point.average, null, lc),
        formatValueByLc(point.error, null, lc),
      ];

      while (row.length < 8) {
        row.push('');
      }
      rows.push(row);
    });
  } else if (template === 'observationmg') {
    dataArray.forEach((point) => {
      if (!point) return;
      const row = [
        point.sequence_number?.toString() || point.sr_no?.toString() || '',
        safeGetValue(point.set_pressure?.uuc_value ?? point.uuc_value),
        safeGetValue(point.set_pressure?.converted_value ?? point.converted_uuc_value ?? point.set_pressure?.uuc_value),
        safeGetValue(point.observations?.master_1 ?? point.m1 ?? (Array.isArray(point.master_readings) ? point.master_readings[0] : '')),
        safeGetValue(point.observations?.master_2 ?? point.m2 ?? (Array.isArray(point.master_readings) ? point.master_readings[1] : '')),
        safeGetValue(point.calculations?.mean ?? point.mean ?? point.average_master),
        safeGetValue(point.calculations?.error ?? point.error),
        safeGetValue(point.calculations?.hysteresis ?? point.hysterisis ?? point.hysteresis),
      ];
      rows.push(row);
    });
  } else if (template === 'observationodfm') {
    dataArray.forEach((point) => {
      if (!point) return;
      const observations = safeGetArray(
        point.observations || point.master || point.master_values || point.master_readings,
        5
      );
      while (observations.length < 5) {
        observations.push('');
      }
      const row = [
        point.sr_no?.toString() || '',
        safeGetValue(point.range || point.workingrange || point.equipmentrange),
        safeGetValue(point.nominal_value ?? point.uuc_value ?? point.point ?? point.setpoint),
        ...observations.slice(0, 5).map((obs) => safeGetValue(obs)),
        safeGetValue(point.average ?? point.averagemaster ?? point.mean),
        safeGetValue(point.error),
      ];
      rows.push(row);
    });
  } else if (template === 'observationvc') {
    const isGroupedArray = dataArray.length > 0 && (dataArray[0]?.calibration_points || dataArray[0]?.points);

    let groups = [];
    if (isGroupedArray) {
      groups = dataArray.map((g) => ({
        title: `${g.matrixtype || g.matrix_type || g.name || 'Measurement'}(in ${g.unit_description || g.unit?.description || g.unit_name || (typeof g.unit === 'string' && isNaN(Number(g.unit)) ? g.unit : 'mm')} )`,
        points: g.calibration_points || g.points || [],
      }));
    } else {
      const hasPointMatrixType = dataArray.some((p) => p && (p.matrixtype || p.matrix_type || p.matrix_name));
      if (hasPointMatrixType) {
        const map = new Map();
        dataArray.forEach((p) => {
          if (!p) return;
          const mType = p.matrixtype || p.matrix_type || p.matrix_name || 'Measurement';
          const mUnit = p.unit_description || p.unit?.description || p.unit_name || (typeof p.unit === 'string' && isNaN(Number(p.unit)) ? p.unit : 'mm');
          const key = `${mType}(in ${mUnit} )`;
          if (!map.has(key)) {
            map.set(key, { title: key, points: [] });
          }
          map.get(key).points.push(p);
        });
        groups = Array.from(map.values());
      } else {
        groups = [{ title: '', points: dataArray }];
      }
    }

    groups.forEach((group) => {
      const points = group.points || [];
      let maxPointVal = -Infinity;
      points.forEach((p) => {
        const ptVal = parseFloat(p?.point || p?.nominal_value || p?.test_point || 0);
        if (!isNaN(ptVal) && ptVal > maxPointVal) {
          maxPointVal = ptVal;
        }
      });

      const groupRows = [];
      points.forEach((point, pointIndex) => {
        if (!point) return;
        const ptVal = parseFloat(point.point || point.nominal_value || point.test_point || 0);
        const isMaxPoint =
          (ptVal === maxPointVal && maxPointVal !== -Infinity) ||
          point.repeatable_cycle === 5 ||
          point.repeatablecycle === 5 ||
          (Array.isArray(point.observations) && point.observations.length >= 5);
        const repeatableCycle = isMaxPoint ? 5 : 3;

        const observations = safeGetArray(point.observations, 5);
        const pointLc = point?.least_count ?? point?.least_count_uuc ?? point?.leastcount;
        const pointLcDec = point?.lc_decimals;

        const row = [
          point.sr_no?.toString() || point.sequence_number?.toString() || (pointIndex + 1).toString(),
          safeGetValue(
            point.master_value !== undefined && point.master_value !== null && point.master_value !== ''
              ? point.master_value
              : (point.nominal_value ?? point.point ?? point.test_point)
          ),
          ...Array.from({ length: 5 }, (_, index) =>
            index < repeatableCycle ? formatValueByLc(observations[index], pointLcDec, pointLc) : ''
          ),
          formatValueByLc(point.average || point.average_master, pointLcDec, pointLc),
          formatValueByLc(point.error, pointLcDec, pointLc),
        ];

        while (row.length < 9) row.push('');
        groupRows.push(row);
        rows.push(row);
      });

      matrixGroups.push({
        title: group.title,
        rows: groupRows,
      });
    });
  } else if (template === 'observationutm') {
    const groups = normalizeUtmGroups(dataArray);
    groups.forEach((group) => {
      group.calibrationPoints.forEach((point, pointIndex) => {
        const masterValues = [0, 1, 2].map((idx) => getObservationValueByType(point, 'master', idx));
        const calculatedUuc = getObservationValueByType(point, 'calculateduuc', 0);
        const rawUuc = getObservationValueByType(point, 'uuc', 0);
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
      });
    });
  } else if (template === 'observationautm') {
    rows = createAUTMRows(dataArray, currentRawdata);
  } else if (template === 'observationpr') {
    const prRes = createPRRows(dataArray, currentRawdata);
    rows = prRes.rows;
    return {
      rows,
      matrixGroups: [],
      unitTypes: [],
      modes: [],
      unit: prRes.unit,
      note: prRes.note,
    };
  } else if (template === 'observationgtm') {
    rows = createGTMRows(dataArray, currentRawdata);
  } else if (template === 'observationdg') {
    rows = createDGRows(dataArray, currentRawdata);
  } else if (template === 'observationsw') {
    rows = createSWViewRows(dataArray);
  }

  return {
    rows: rows || [],
    matrixGroups: matrixGroups || [],
    unitTypes: unitTypes || [],
    modes: modes || [],
    hiddenInputs,
    weighingCount,
    repeatabilityCount,
    eccentricityCount,
  };
};

/**
 * Parses raw API response data for any observation template
 */
export const parseDynamicObservation = (
  template,
  observationData,
  response,
  setThermalCoeff,
  setEquipmentData,
  setRawdata,
  setParallelism
) => {
  if (template === 'observationbiomedical') {
    return parseBiomedicalDynamicData(observationData);
  } else if (template === 'observationcustom') {
    return parseCustomDynamicData(observationData, setRawdata);
  } else if (template === 'observationdpg') {
    return parseDPGDynamicData(observationData);
  } else if (template === 'observationctg') {
    return parseCTGDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationmt') {
    return parseMTDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationfg') {
    return parseFGDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationmsr') {
    return parseMSRDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationhg') {
    return parseHGDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationit') {
    return parseITDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationtm') {
    return parseTMDynamicData(observationData);
  } else if (template === 'observationuc') {
    return parseUCDynamicData(observationData);
  } else if (template === 'observationmm') {
    return parseMMDynamicData(observationData);
  } else if (template === 'observationrtdwi') {
    return parseRTDWIDynamicData(observationData);
  } else if (template === 'observationtswoi') {
    return parseTSWOIDynamicData(observationData);
  } else if (template === 'observationrtdwoi') {
    return parseRTDWOIDynamicData(observationData);
  } else if (template === 'observationtswi') {
    return parseTSWIDynamicData(observationData);
  } else if (template === 'observationapg') {
    return parseAPGDynamicData(observationData);
  } else if (template === 'observationdw') {
    return parseDWDynamicData(observationData, response, setEquipmentData);
  } else if (template === 'observationwb' || template === 'observationwbn') {
    return parseWBDynamicData(observationData);
  } else if (template === 'observationts') {
    return parseTSDynamicData(observationData, response, setThermalCoeff);
  } else if (template === 'observationsw') {
    return parseSWDynamicData(observationData);
  } else if (template === 'observationvc') {
    const therm = observationData.thermal_coeff || observationData.thermal_coefficients || response?.data?.thermal_coefficients;
    if (therm && setThermalCoeff) {
      setThermalCoeff({
        uuc: therm.uuc || therm.thermal_coeff_uuc || '',
        master: therm.master || therm.thermal_coeff_master || '',
        thickness_of_graduation: '',
      });
    }
    const addl = response?.data?.additional_measurements || observationData.additional_measurements || {};
    const parall = observationData.parallelism || observationData.parallel || {};
    if (setParallelism) {
      setParallelism({
        parallinternal: addl.external_jaws?.value ?? addl.parallelism_internal?.value ?? parall.parallinternal ?? parall.internal ?? observationData.parallinternal ?? '',
        parallexternal: addl.internal_jaws?.value ?? addl.parallelism_external?.value ?? parall.parallexternal ?? parall.external ?? observationData.parallexternal ?? '',
      });
    }

    if (observationData.matrix_groups && Array.isArray(observationData.matrix_groups)) {
      return observationData.matrix_groups;
    } else if (observationData.matrices && Array.isArray(observationData.matrices)) {
      return observationData.matrices;
    } else if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
      return observationData.unit_types;
    } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
      return observationData.calibration_points;
    } else if (observationData.points && Array.isArray(observationData.points)) {
      return observationData.points;
    } else if (observationData.data && Array.isArray(observationData.data)) {
      return observationData.data;
    } else if (Array.isArray(observationData)) {
      return observationData;
    }
    return [];
  } else if (template === 'observationodfm') {
    if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
      return observationData.calibration_points;
    } else if (observationData.data?.calibration_points && Array.isArray(observationData.data.calibration_points)) {
      return observationData.data.calibration_points;
    } else if (observationData.points && Array.isArray(observationData.points)) {
      return observationData.points;
    } else if (observationData.data && Array.isArray(observationData.data)) {
      return observationData.data;
    } else if (Array.isArray(observationData)) {
      return observationData;
    }
    return [];
  } else if (template === 'observationppg') {
    const obsList = observationData.observations || observationData.observation_data?.observations || observationData.data?.observations;
    return Array.isArray(obsList) ? obsList : [];
  } else if (template === 'observationavg') {
    const avgData = observationData.data || observationData;
    return (avgData.calibration_point && Array.isArray(avgData.calibration_point)) ? avgData.calibration_point : [];
  } else if (template === 'observationexm') {
    if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
      if (observationData.thermal_coefficients && setThermalCoeff) {
        let addlExm = response?.data?.additional_measurements || observationData?.additional_measurements || {};
        if (typeof addlExm === 'string') { try { addlExm = JSON.parse(addlExm); } catch { addlExm = {}; } }
        setThermalCoeff({
          uuc: observationData.thermal_coefficients.uuc || '',
          master: observationData.thermal_coefficients.master || '',
          thickness_of_graduation: '',
          parallinternal: addlExm.parallelism_spindle_anvil?.value ?? addlExm.parallinternal?.value ?? '',
        });
      }
      return observationData.calibration_points;
    }
    return [];
  } else if (template === 'observationmg') {
    const mgData = observationData.data || observationData;
    if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
      return mgData.calibration_points;
    } else if (mgData.observations && Array.isArray(mgData.observations)) {
      return mgData.observations;
    }
    return [];
  } else if (template === 'observationgtm') {
    return parseGTMDynamicData(observationData);
  } else if (template === 'observationautm') {
    return parseAUTMDynamicData(observationData);
  } else if (template === 'observationdg') {
    return parseDGDynamicData(observationData, setThermalCoeff);
  } else if (template === 'observationwwbn') {
    if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
      return observationData.calibration_points;
    } else if (observationData.data && Array.isArray(observationData.data)) {
      return observationData.data;
    } else if (Array.isArray(observationData)) {
      return observationData;
    }
    return [];
  }

  return Array.isArray(observationData) ? observationData : [];
};
