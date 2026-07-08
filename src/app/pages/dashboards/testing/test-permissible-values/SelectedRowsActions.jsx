// Import Dependencies
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment } from "react";
import { CiViewTable } from "react-icons/ci";
import PropTypes from "prop-types";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Local Imports
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function SelectedRowsActions({ table, title = "Permissible Values" }) {
  const selectedRows = table.getSelectedRowModel().rows;

  // --- LOGIC: PRINTING ---
  const handlePrint = () => {
    try {
      toast.success("Preparing for print...");

      const activeColumns = table
        .getAllColumns()
        .filter(
          (col) =>
            col.getIsVisible() &&
            !["select", "actions", "expander"].includes(col.id),
        );

      const headers = activeColumns.map((col) => {
        const header =
          typeof col.columnDef.header === "string"
            ? col.columnDef.header
            : col.id;
        return String(header).toUpperCase();
      });

      const rows = selectedRows.map((row) =>
        activeColumns.map((col) => {
          const val = row.getValue(col.id);
          return val === undefined || val === null ? "" : String(val);
        }),
      );

      const printWindow = window.open("", "_blank");
      const html = `
        <html>
          <head>
            <title>Print ${title}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f7f7f7; font-weight: bold; text-transform: uppercase; font-size: 11px; }
              td { font-size: 10px; }
              .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">KAILTECH</div>
              <h2>${title}</h2>
              <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <table>
              <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
              <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
            </table>
            <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to generate print view");
    }
  };

  // --- LOGIC: EXPORT CSV ---
  const handleExportCSV = () => {
    try {
      const activeColumns = table
        .getAllColumns()
        .filter(
          (col) =>
            col.getIsVisible() &&
            !["select", "actions", "expander"].includes(col.id),
        );

      const headers = activeColumns.map((col) => {
        const header =
          typeof col.columnDef.header === "string"
            ? col.columnDef.header
            : col.id;
        return header.toUpperCase();
      });

      const csvContent = [
        headers.join(","),
        ...selectedRows.map((row) =>
          activeColumns
            .map(
              (col) =>
                `"${String(row.getValue(col.id) || "").replace(/"/g, '""')}"`,
            )
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(
        blob,
        `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to export CSV");
    }
  };

  // --- LOGIC: EXPORT PDF ---
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const activeColumns = table
        .getAllColumns()
        .filter(
          (col) =>
            col.getIsVisible() &&
            !["select", "actions", "expander"].includes(col.id),
        );
      const headers = activeColumns.map((col) =>
        String(
          typeof col.columnDef.header === "string"
            ? col.columnDef.header
            : col.id,
        ).toUpperCase(),
      );
      const body = selectedRows.map((row) =>
        activeColumns.map((col) => String(row.getValue(col.id) || "")),
      );

      doc.text("KAILTECH - " + title, 14, 15);
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 20,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [79, 70, 229] },
      });
      doc.save(`${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <Transition
      as={Fragment}
      show={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}
      enter="transition-all duration-200"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="pointer-events-none sticky inset-x-0 bottom-0 z-5 flex items-center justify-end">
        <div className="w-full max-w-xl px-2 py-4 sm:absolute sm:-translate-y-1/2 sm:px-4">
          <div className="pointer-events-auto flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2 font-medium text-gray-100 dark:bg-dark-50 dark:text-dark-900 sm:px-4 sm:py-3">
            <p>
              <span>{selectedRows.length} Selected</span>
              <span className="max-sm:hidden">
                {" "}
                from {table.getCoreRowModel().rows.length}
              </span>
            </p>
            <div className="flex space-x-1.5 ">
              <Button
                onClick={handlePrint}
                className="w-7 gap-1.5 rounded-full px-3 py-1.5 text-xs-plus sm:w-auto sm:rounded-sm "
              >
                <PrinterIcon className="size-4 shrink-0" />
                <span className="max-sm:hidden">Print</span>
              </Button>
              <Menu as="div" className="relative inline-block text-left">
                <MenuButton
                  as={Button}
                  className="w-7 gap-1.5 rounded-full px-3 py-1.5 text-xs-plus sm:w-auto sm:rounded-sm"
                >
                  <EllipsisHorizontalIcon className="size-4 shrink-0" />
                  <span className="max-sm:hidden"> More</span>{" "}
                </MenuButton>
                <Transition
                  as={MenuItems}
                  enter="transition ease-out"
                  enterFrom="opacity-0 translate-y-2"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-2"
                  className="absolute z-100 min-w-[10rem] rounded-lg border border-gray-300 bg-white py-1 text-xs-plus text-gray-600 shadow-soft outline-none focus-visible:outline-none dark:border-dark-500 dark:bg-dark-750 dark:text-dark-200 dark:shadow-none"
                  anchor={{ to: "top end", gap: 6 }}
                >
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleExportCSV}
                        className={clsx(
                          "flex h-9 w-full items-center space-x-3 px-3 tracking-wide outline-none transition-colors ",
                          focus &&
                            "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100",
                        )}
                      >
                        <ArrowUpTrayIcon className="size-4.5" />
                        <span>Export CSV</span>
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleExportPDF}
                        className={clsx(
                          "flex h-9 w-full items-center space-x-3 px-3 tracking-wide outline-none transition-colors ",
                          focus &&
                            "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100",
                        )}
                      >
                        <ArrowUpTrayIcon className="size-4.5" />
                        <span>Export PDF</span>
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => table.resetRowSelection()}
                        className={clsx(
                          "flex h-9 w-full items-center space-x-3 px-3 tracking-wide outline-none transition-colors ",
                          focus &&
                            "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100",
                        )}
                      >
                        <CiViewTable className="size-4.5" />
                        <span>Clear Selection</span>
                      </button>
                    )}
                  </MenuItem>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}

SelectedRowsActions.propTypes = {
  table: PropTypes.object,
  title: PropTypes.string,
};
