import PropTypes from "prop-types";
import { useState } from "react";
import { MarkDoneModal } from "./MarkDoneModal";

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTesting = row.original?.purpose_name?.toLowerCase() === "testing" || row.original?.purpose == "1";

  const handleUpdate = () => {
    // Optionally trigger a table refresh here
    table.options.meta?.refetch?.();
  };

  return (
    <div className="flex justify-center space-x-2">
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-green-50 px-3 py-1 text-xs font-bold text-green-700 transition hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
      >
        <span>{isTesting ? "Mark BRN/LRN Done" : "Accept"}</span>
      </button>

      <MarkDoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gateEntry={row.original}
        onUpdate={handleUpdate}
      />
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};

