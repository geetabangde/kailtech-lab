import { saveAs } from "file-saver";

/**
 * Exports Product Type Stock data to an Excel (.xls) file matching PHP template logic.
 * @param {Array} data - The stock list array to export.
 */
export function exportStockToExcel(data) {
  const filename = "subcategorylist.xls";
  const sheetName = "Product Type Subcategory";

  const headers = [
    "Id",
    "Name of Equipment.",
    "Category",
    "Type",
    "Important",
    "UOM",
    "Minimum Quantity",
    "Available Quantity",
    "Add Quantity"
  ];

  let xml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #dddddd; padding: 8px; text-align: left; }
        td { border: 1px solid #dddddd; padding: 8px; text-align: left; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
  `;

  headers.forEach(h => {
    xml += `<th>${h}</th>`;
  });

  xml += `
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach(row => {
    xml += `
      <tr>
        <td>${row.id ?? ""}</td>
        <td>${row.name ?? ""}</td>
        <td>${row.cname ?? ""}</td>
        <td>${row.type_name ?? row.type ?? ""}</td>
        <td>${row.critical_name ?? row.critical ?? ""}</td>
        <td>${row.unit_name ?? row.unit ?? ""}</td>
        <td>${row.min ?? 0}</td>
        <td>${row.quantity ?? 0}</td>
        <td></td>
      </tr>
    `;
  });

  xml += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  saveAs(blob, filename);
}
