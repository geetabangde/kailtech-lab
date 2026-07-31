import { createColumnHelper } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import axios from "utils/axios";

// Local Imports
import { RowActions } from "./RowActions";

// Simple cache to prevent redundant API calls for the same ID
const nameCache = {};

function SpecificPurposeCell({ id }) {
  const [name, setName] = useState(nameCache[id] || "—");
  const [loading, setLoading] = useState(!nameCache[id]);

  useEffect(() => {
    if (!id || id === "0" || nameCache[id]) return;

    const fetchName = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/people/get-specific-purpose-byid/${id}`);
        // Handle both: { data: { name: "..." } } AND { Data: [ { name: "..." } ] }
        const obj = res.data?.data ?? res.data?.Data;
        const d = Array.isArray(obj) ? obj[0]?.name : obj?.name;

        nameCache[id] = d || "—";
        setName(d || "—");
      } catch {
        setName("—");
      } finally {
        setLoading(false);
      }
    };
    fetchName();
  }, [id]);

  if (loading) return <span className="animate-pulse text-gray-400">...</span>;
  return (
    <span className="block max-w-[240px] mx-auto text-center whitespace-normal text-xs leading-tight">
      {name}
    </span>
  );
}

// Similarly for Customer Type
function CustomerTypeCell({ id }) {
  const [name, setName] = useState(nameCache[`ct_${id}`] || "—");
  const [loading, setLoading] = useState(!nameCache[`ct_${id}`]);

  useEffect(() => {
    if (!id || id === "0" || nameCache[`ct_${id}`]) return;

    const fetchName = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/people/get-customer-type-byid/${id}`);
        // Handle both: { data: { name: "..." } } AND { Data: [ { name: "..." } ] }
        const obj = res.data?.data ?? res.data?.Data;
        const d = Array.isArray(obj) ? obj[0]?.name : obj?.name;

        nameCache[`ct_${id}`] = d || "—";
        setName(d || "—");
      } catch {
        setName("—");
      } finally {
        setLoading(false);
      }
    };
    fetchName();
  }, [id]);

  if (loading) return <span className="animate-pulse text-gray-400">...</span>;
  return (
    <span className="block max-w-[240px] whitespace-normal text-xs leading-tight">
      {name}
    </span>
  );
}

const columnHelper = createColumnHelper();

export const columns = [


  // S. No.
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S. No.",
    cell: (info) => info.row.index + 1,
    enableColumnFilter: false,
  }),

  // Product
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[200px] whitespace-normal text-xs leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Package
  columnHelper.accessor("package", {
    id: "package",
    header: "Package",
    cell: (info) => (
      <span className="block max-w-[240px] whitespace-normal text-xs leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Grade/Size
  columnHelper.accessor((row) => {
    const g = row.grade_name || row.grade || "NA";
    const s = row.size_name || row.size || "NA";
    return `${g} / ${s}`;
  }, {
    id: "grade_size",
    header: "Grade/Size",
    cell: (info) => (
      <span className="block max-w-[240px] whitespace-normal text-xs font-medium text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Customer Type — API: ctype
  columnHelper.accessor("ctype", {
    id: "customer_type",
    header: "Customer Type",
    cell: (info) => <CustomerTypeCell id={info.getValue()} />,
    filterFn: "includesString",
  }),

  // Specific Purpose — API: specificpurpose
  columnHelper.accessor("specificpurpose", {
    id: "specific_purpose",
    header: () => <div className="text-center leading-tight">Specific <br /> Purpose</div>,
    cell: (info) => <SpecificPurposeCell id={info.getValue()} />,
    filterFn: "includesString",
  }),

  // Action
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
    enableColumnFilter: false,
  }),
];