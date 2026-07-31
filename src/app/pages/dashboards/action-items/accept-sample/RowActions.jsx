import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";

export function RowActions({ row, table }) {
  const [loading, setLoading] = useState(false);

  // POST /actionitem/accept-alloted-item — PHP: insertalloteditems logic
  const handleAccept = useCallback(async () => {
    const id = row.original.id;
    setLoading(true);
    try {
      await axios.post("/actionitem/accept-alloted-item", { id });
      toast.success("Item Accepted Successfully ✅");
      // Remove from list after accept
      table.options.meta?.deleteRow(row);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to accept item.";
      toast.error(msg + " ❌");
    } finally {
      setLoading(false);
    }
  }, [row, table]);

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className={`rounded bg-green-600 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-green-700 ${
        loading ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      {loading ? "..." : "Accept"}
    </button>
  );
}

RowActions.propTypes = {
  row:   PropTypes.object,
  table: PropTypes.object,
};