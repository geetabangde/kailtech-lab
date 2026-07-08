import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  // ID
  columnHelper.accessor((row) => String(row.id), {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue(),
    filterFn: "includesString",
  }),

  // Quantity Measured/Instrument
  columnHelper.accessor("quantity measured/instrument", {
    id: "quantity measured/instrument",
    header: "Quantity Measured/ Instrument",
    cell: (info) => info.getValue() || "-",
  }),

  // Mode
  columnHelper.accessor("mode", {
    id: "mode",
    header: "Mode",
    cell: (info) => info.getValue() || "-",
  }),

  // Range/Frequency
  columnHelper.accessor("range/frequency", {
    id: "range/frequency",
    header: "Range / Frequency",
    cell: (info) => info.getValue() || "-",
  }),

  // Calibration Measurement Capability
  columnHelper.accessor("* calibration measurement capability(±)", {
    id: "* calibration measurement capability(±)",
    header: "* Calibration Measurement Capability(±)",
    cell: (info) => info.getValue() || "-",
  }),

  // Location
  columnHelper.accessor("instrumentlocation", {
    id: "instrumentlocation",
    header: "Location",
    cell: (info) => info.getValue() || "-",
  }),

  // Remark
  columnHelper.accessor("certcollectionremark", {
    id: "certcollectionremark",
    header: "Remark",
    cell: (info) => info.getValue() || "-",
  }),

  // Row Actions (Edit/Delete buttons)
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: RowActions,
  }),
];
