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

  // FinalReportDetail.jsx
  // const hasSpecs = testResults.some((r) => r.specification && r.specification !== "—");
  content = content.replace(
    /const hasSpecs = testResults\.some\(\(r\) => r\.specification && r\.specification !== "—"\);/g,
    'const hasSpecs = trfProduct?.specification_flag === 2 ? false : (trfProduct?.specification_flag === 1 || Number(trfProduct?.specification) === 1 || testResults.some((r) => r.specification && r.specification !== "—" && r.specification !== "-"));'
  );

  // ReviewByQaDetail.jsx
  // const hasSpecs =
  //   trfProduct?.specification_flag === 1 ||
  //   Number(trfProduct?.specification) === 1 ||
  //   test_results.some((r) => r.specification && r.specification !== "-");
  content = content.replace(
    /const hasSpecs =\s*trfProduct\?\.specification_flag === 1 \|\|\s*Number\(trfProduct\?\.specification\) === 1 \|\|\s*test_results\.some\(\(r\) => r\.specification && r\.specification !== "-"\);/g,
    'const hasSpecs = trfProduct?.specification_flag === 2 ? false : (trfProduct?.specification_flag === 1 || Number(trfProduct?.specification) === 1 || test_results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));'
  );

  // ExportTestingReport.jsx
  // const hasSpecs =
  //   trf_product?.specification_flag === 1 ||
  //   Number(trf_product?.specification) === 1 ||
  //   toArray(test_results).some((r) => r.specification && r.specification !== "—");
  content = content.replace(
    /const hasSpecs =\s*trf_product\?\.specification_flag === 1 \|\|\s*Number\(trf_product\?\.specification\) === 1 \|\|\s*toArray\(test_results\)\.some\(\(r\) => r\.specification && r\.specification !== "—"\);/g,
    'const hasSpecs = trf_product?.specification_flag === 2 ? false : (trf_product?.specification_flag === 1 || Number(trf_product?.specification) === 1 || toArray(test_results).some((r) => r.specification && r.specification !== "—" && r.specification !== "-"));'
  );

  // ExportTestingReportWOLHTwoSign.jsx
  content = content.replace(
    /const hasSpecs =\s*trf_product\?\.specification_flag === 1 \|\|\s*Number\(trf_product\?\.specification\) === 1 \|\|\s*toArray\(test_results\)\.some\(\(r\) => r\.specification && r\.specification !== "-"\);/g,
    'const hasSpecs = trf_product?.specification_flag === 2 ? false : (trf_product?.specification_flag === 1 || Number(trf_product?.specification) === 1 || toArray(test_results).some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));'
  );

  // TestReportPdf.jsx (in generate-ulr, review-by-hod, review-by-qa)
  // const hasSpecs =
  //   trf_product?.specification_flag === 1 ||
  //   Number(trf_product?.specification) === 1 ||
  //   test_results.some((r) => r.specification && r.specification !== "-");
  content = content.replace(
    /const hasSpecs =\s*trf_product\?\.specification_flag === 1 \|\|\s*Number\(trf_product\?\.specification\) === 1 \|\|\s*test_results\.some\(\(r\) => r\.specification && r\.specification !== "-"\);/g,
    'const hasSpecs = trf_product?.specification_flag === 2 ? false : (trf_product?.specification_flag === 1 || Number(trf_product?.specification) === 1 || test_results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));'
  );

  // ReviewByHodDetail.jsx
  // const hasSpecs =
  //   trf_product?.specification_flag === 1 ||
  //   Number(trf_product?.specification) === 1 ||
  //   test_results.some((r) => r.specification && r.specification !== "-");
  content = content.replace(
    /const hasSpecs =\s*trf_product\?\.specification_flag === 1 \|\|\s*Number\(trf_product\?\.specification\) === 1 \|\|\s*test_results\.some\(\(r\) => r\.specification && r\.specification !== "-"\);/g,
    'const hasSpecs = trf_product?.specification_flag === 2 ? false : (trf_product?.specification_flag === 1 || Number(trf_product?.specification) === 1 || test_results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));'
  );

  // DraftReportView.jsx & ExportReportWithLH.jsx
  // const hasSpecs = results.some(
  //   (r) => r.specification && r.specification !== "-",
  // );
  content = content.replace(
    /const hasSpecs = results\.some\(\s*\(r\)\s*=>\s*r\.specification && r\.specification !== "-",\s*\);/g,
    'const hasSpecs = (typeof trf_product !== "undefined" ? trf_product?.specification_flag : null) === 2 ? false : ((typeof trf_product !== "undefined" && trf_product?.specification_flag === 1) || results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));'
  );

  // ExportReportWoLH.jsx
  // const hasSpecs = results.some((r) => r.specification && r.specification !== "-");
  content = content.replace(
    /const hasSpecs = results\.some\(\(r\) => r\.specification && r\.specification !== "-"\);/g,
    'const hasSpecs = (typeof trf_product !== "undefined" ? trf_product?.specification_flag : null) === 2 ? false : ((typeof trf_product !== "undefined" && trf_product?.specification_flag === 1) || results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));'
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Updated: " + file);
    count++;
  }
});

console.log("Total updated: " + count);
