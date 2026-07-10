const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/pages/dashboards/action-items');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace strict equality `=== 2` and `=== 1` with `Number() === ...` for specification_flag
  
  content = content.replace(/trfProduct\?\.specification_flag === 2/g, 'Number(trfProduct?.specification_flag) === 2');
  content = content.replace(/trfProduct\?\.specification_flag === 1/g, 'Number(trfProduct?.specification_flag) === 1');
  
  content = content.replace(/trf_product\?\.specification_flag === 2/g, 'Number(trf_product?.specification_flag) === 2');
  content = content.replace(/trf_product\?\.specification_flag === 1/g, 'Number(trf_product?.specification_flag) === 1');
  
  // Also handle the typeof check in DraftReportView
  content = content.replace(/\(typeof trf_product !== "undefined" \? trf_product\?\.specification_flag : null\) === 2/g, 'Number(typeof trf_product !== "undefined" ? trf_product?.specification_flag : null) === 2');
  content = content.replace(/typeof trf_product !== "undefined" && trf_product\?\.specification_flag === 1/g, 'typeof trf_product !== "undefined" && Number(trf_product?.specification_flag) === 1');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Updated numeric check in: " + file);
    count++;
  }
});

console.log("Total fixed for numeric conversion: " + count);
