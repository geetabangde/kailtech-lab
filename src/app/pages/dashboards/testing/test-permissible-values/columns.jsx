// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. ID
  columnHelper.accessor((row) => String(row.id), {
    id: "id",
    header: () => <div className="text-center">ID</div>,
    cell: (info) => info.getValue(),
    filterFn: "includesString",
    meta: { align: "center" },
  }),

  // 2. Product
  columnHelper.accessor(
    (row) => {
      return row.product_name || row.name || row.desci;
    },
    {
      id: "product_name",
      header: "PRODUCT",
      cell: (info) => {
        const val = info.getValue();
        if (!val) return val;

        // Split by " - " delimiter
        const parts = String(val).split(" - ");
        if (parts.length > 1) {
          return (
            <div className="flex flex-col py-1 whitespace-normal max-w-[250px] break-words">
              <span className="dark:text-dark-100 text-gray-700 font-medium">
                {parts[0]}
              </span>
              <span className="dark:text-dark-400 text-gray-700">
                {parts.slice(1).join(" - ")}
              </span>
            </div>
          );
        }
        return <div className="py-1 whitespace-normal max-w-[250px] break-words">{val}</div>;
      },
      filterFn: "includesString",
    },
  ),

  // 3. Parameter
  columnHelper.accessor(
    (row) => {
      const val = row.parameter_name || row.parametername || row.parameter;
      if (Array.isArray(val)) {
        return val.join(", ");
      }
      return val;
    },
    {
      id: "parameter_name",
      header: "PARAMETER",
      cell: (info) => (
        <div className="whitespace-normal break-words max-w-[200px]">
          {info.getValue()}
        </div>
      ),
      filterFn: "includesString",
    },
  ),

  // 4. Standard
  columnHelper.accessor(
    (row) => {
      return row.standard_name || row.standardname || row.standard;
    },
    {
      id: "standard_name",
      header: "STANDARD",
      cell: (info) => (
        <div className="whitespace-normal break-words max-w-[150px]">
          {info.getValue()}
        </div>
      ),
      filterFn: "includesString",
    },
  ),

  // 5. Range
  columnHelper.accessor(
    (row) => {
      const { pvaluemin, pvaluemax } = row;
      const isValid = (val) => val !== null && val !== undefined;

      if (Array.isArray(pvaluemin) && Array.isArray(pvaluemax)) {
        return pvaluemin
          .map(
            (min, i) =>
              `${isValid(min) ? min : ""} - ${isValid(pvaluemax[i]) ? pvaluemax[i] : ""}`,
          )
          .join(", ");
      }

      const hasMin = isValid(pvaluemin);
      const hasMax = isValid(pvaluemax);

      if (hasMin || hasMax) {
        return `${hasMin ? pvaluemin : ""} - ${hasMax ? pvaluemax : ""}`;
      }
      return null;
    },
    {
      id: "range",
      header: "RANGE",
      cell: (info) => (
        <div className="whitespace-normal break-words max-w-[150px]">
          {info.getValue()}
        </div>
      ),
      filterFn: "includesString",
    },
  ),

  // 6. Grade/Size
  columnHelper.accessor(
    (row) => {
      const { grade_name, size_name, grade, size } = row;
      const g = grade_name ?? grade;
      const s = size_name ?? size;

      const parts = [g, s].filter(val => val !== null && val !== undefined && val !== "");
      return parts.length > 0 ? parts.join(" / ") : null;
    },
    {
      id: "grade_size",
      header: "GRADE/SIZE",
      cell: (info) => (
        <div className="whitespace-normal break-words max-w-[150px]">
          {info.getValue()}
        </div>
      ),
      filterFn: "includesString",
    },
  ),

  // 7. Specification
  columnHelper.accessor(
    (row) => {
      const val = row.specification;
      if (Array.isArray(val)) {
        return val.join(", ");
      }
      return val;
    },
    {
      id: "specification",
      header: "SPECIFICATION",
      cell: (info) => (
        <div className="whitespace-normal max-w-[200px] break-words">
          {info.getValue()}
        </div>
      ),
      filterFn: "includesString",
    },
  ),

  // 8. Actions
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center w-full">ACTIONS</div>,
    cell: RowActions,
    enableColumnFilter: false,
    meta: { align: "center" },
  }),
];
