// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [


  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Mode Name (from API)
  columnHelper.accessor("name", {
    id: "name",
    header: "Calibration Standard Name",
    cell: (info) => {
      const val = info.getValue();
      const displayVal = typeof val === 'object' && val !== null ? (val.name || JSON.stringify(val)) : val;
      return (
        <div className="whitespace-normal min-w-[200px] text-sm">
          {displayVal}
        </div>
      );
    },
  }),

  // ✅ Description (from API)
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => {
      const val = info.getValue();
      const displayVal = typeof val === 'object' && val !== null ? (val.name || JSON.stringify(val)) : val;
      return (
        <div className="whitespace-normal min-w-[200px] text-sm">
          {displayVal}
        </div>
      );
    },
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: RowActions,
  }),
];
