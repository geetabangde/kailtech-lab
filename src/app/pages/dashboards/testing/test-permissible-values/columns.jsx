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
      const val = row.product_name || row.name || row.desci;
      return val && val !== "-" && val !== "NA" ? val : "N/A";
    },
    {
      id: "product_name",
      header: "PRODUCT",
      cell: (info) => {
        const val = info.getValue();
        if (!val || val === "-") return "-";

        // Split by " - " delimiter
        const parts = val.split(" - ");
        if (parts.length > 1) {
          return (
            <div className="flex flex-col py-1 whitespace-normal min-w-[350px] max-w-md">
              <span className="dark:text-dark-100 text-gray-700 font-medium">
                {parts[0]}
              </span>
              <span className="dark:text-dark-400 text-gray-700">
                {parts.slice(1).join(" - ")}
              </span>
            </div>
          );
        }
        return <div className="py-1 whitespace-normal min-w-[350px] max-w-md">{val}</div>;
      },
      filterFn: "includesString",
    },
  ),

  // 3. Parameter
  columnHelper.accessor(
    (row) => {
      const val = row.parameter_name || row.parametername || row.parameter;
      if (Array.isArray(val)) {
        return (
          val.filter((v) => v && v !== "-" && v !== "NA").join(", ") || "N/A"
        );
      }
      return val && val !== "-" && val !== "NA" ? val : "N/A";
    },
    {
      id: "parameter_name",
      header: "PARAMETER",
      cell: (info) => info.getValue(),
      filterFn: "includesString",
    },
  ),

  // 4. Standard
  columnHelper.accessor(
    (row) => {
      const val = row.standard_name || row.standardname || row.standard;
      return val && val !== "-" && val !== "NA" ? val : "N/A";
    },
    {
      id: "standard_name",
      header: "STANDARD",
      cell: (info) => info.getValue(),
      filterFn: "includesString",
    },
  ),

  // 5. Range
  columnHelper.accessor(
    (row) => {
      const { pvaluemin, pvaluemax } = row;
      const isValid = (val) =>
        val !== null && val !== undefined && val !== "" && val !== "NA";

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
      return "N/A";
    },
    {
      id: "range",
      header: "RANGE",
      cell: (info) => info.getValue(),
      filterFn: "includesString",
    },
  ),

  // 6. Grade/Size
  columnHelper.accessor(
    (row) => {
      const { grade_name, size_name, grade, size } = row;
      const isValid = (val) =>
        val && val !== "NA" && val !== "N/A" && val !== "-";

      const g = isValid(grade_name)
        ? grade_name
        : isValid(grade)
          ? grade
          : null;
      const s = isValid(size_name) ? size_name : isValid(size) ? size : null;

      return [g, s].filter(Boolean).join(" / ") || "N/A";
    },
    {
      id: "grade_size",
      header: "GRADE/SIZE",
      cell: (info) => info.getValue(),
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
      cell: (info) => info.getValue(),
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
