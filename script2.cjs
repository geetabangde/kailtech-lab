const fs = require('fs');
let content = fs.readFileSync('src/app/pages/dashboards/calibration-process/inward-entry-lab/ViewRawData.jsx', 'utf8');

const targetStr = `    } else if (template === 'observationctg') {
      dataArray.forEach((point) => {
        const observations = safeGetArray(point?.observations, count);
        const row = [
          point?.sr_no?.toString() || '',
          point?.nominal_value || '',
          ...observations.slice(0, count).map((obs) => safeGetValue(obs)),
          safeGetValue(point?.average),
          safeGetValue(point?.error),
        ];

        // Append dynamic new columns
        newCols.forEach(col => {
          row.push(safeGetValue(point?.[col.column_key]));
        });

        rows.push(row);
      });`;

const replacementStr = `    } else if (template === 'observationctg') {
      dataArray.forEach((point) => {
        const observations = safeGetArray(point?.observations, count);
        let row = [];
        
        if (backendCols && backendCols.length > 0) {
          row = [...backendCols].sort((a, b) => a.sort_order - b.sort_order).map(col => {
            const key = col.column_key;
            if (key === 'sr_no') return point?.sr_no?.toString() || '';
            if (key === 'master') return point?.nominal_value || '';
            if (key && key.startsWith('uuc_')) {
              const index = parseInt(key.replace('uuc_', ''), 10);
              return safeGetValue(observations[index]);
            }
            if (key === 'average' || key === 'averageuuc') return safeGetValue(point?.average);
            if (key === 'error') return safeGetValue(point?.error);
            return safeGetValue(point?.[key]);
          });
        } else {
          // Fallback
          row = [
            point?.sr_no?.toString() || '',
            point?.nominal_value || '',
            ...observations.slice(0, count).map((obs) => safeGetValue(obs)),
            safeGetValue(point?.average),
            safeGetValue(point?.error),
          ];
        }

        rows.push(row);
      });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/app/pages/dashboards/calibration-process/inward-entry-lab/ViewRawData.jsx', content);
  console.log('Successfully applied dynamic row generation for observationctg');
} else {
  console.log('Target string not found in file!');
}
