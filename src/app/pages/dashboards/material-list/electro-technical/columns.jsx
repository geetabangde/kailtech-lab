import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

import { DateCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [

  // ✅ S No (index based)
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Name (Instrument Name) - FIXED
  columnHelper.accessor("name", {
    id: "name",
    label: "Name",
    header: "Name",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Id No (Instrument ID) - FIXED
  columnHelper.accessor("idno", {
    id: "idno",
    label: "Id No",
    header: "Id No",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ New Id No - FIXED
  columnHelper.accessor("newidno", {
    id: "newidno",
    header: "New Id No",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Serial No - FIXED
  columnHelper.accessor("serialno", {
    id: "serialno",
    header: "Serial No",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Available Quantity - FIXED
  columnHelper.accessor("qty", {
    id: "qty",
    label: "Quantity",
    header: () => <div className="text-center">Available <br /> Quantity</div>,
    cell: (info) => info.getValue() || "0",
  }),

  // ✅ Category
  columnHelper.accessor("category", {
    id: "category",
    header: "Category",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Location - API returns stocked lab names as "locations" (comma-separated);
  // fall back to "instrumentlocation" in case the backend field is renamed.
  columnHelper.accessor((row) => row.locations || row.instrumentlocation, {
    id: "location",
    header: "Location",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Make
  columnHelper.accessor("make", {
    id: "make",
    header: "Make",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Model
  columnHelper.accessor("model", {
    id: "model",
    header: "Model",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Purchase Date - FIXED
  columnHelper.accessor("purchasedate", {
    id: "purchasedate",
    label: "Purchase Date",
    header: "Purchase Date",
    cell: DateCell,
    // filter: "dateRange",
    // filterFn: "inNumberRange",
  }),

  // ✅ Action
  columnHelper.display({
    id: "actions",
    label: "Row Actions",
    header: "Action",
    cell: RowActions,
  }),
];