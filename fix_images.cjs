const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/app/pages/dashboards/action-items/**/TestReportPdf.jsx');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content.replace(/src="\/images\/([^"]+)"/g, 'src={`${window.location.origin}/images/$1`}');
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Updated', f);
  }
});
