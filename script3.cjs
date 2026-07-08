const fs = require('fs');
const file = 'c:/Users/pc-obe/Desktop/lims-kailtech/src/app/pages/dashboards/calibration-operations/instrument-list/components/AddCalibration.jsx';
let content = fs.readFileSync(file, 'utf8');

// The string currently contains `uuc` literally. We need to replace it with `uuc${i + 1}`
// We only want to replace instances of `uuc` that are inside backticks: \`uuc\`
content = content.replace(/`uuc`/g, '`uuc${i + 1}`');
content = content.replace(/`master`/g, '`master${i + 1}`');
content = content.replace(/`obs`/g, '`obs${i + 1}`');

fs.writeFileSync(file, content);
console.log("Replaced successfully!");
