import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "components/ui";
import { ChooseGateItem } from "./ChooseGateItem";

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center space-x-1.5">
        <Button
          variant="outline"
          size="sm"
          className="text-info-600 border-info-200 hover:bg-info-50 dark:text-info-400 dark:border-info-800 dark:hover:bg-info-900/30"
          onClick={() => setModalOpen(true)}
        >
          Issue Item To People
        </Button>
      </div>

      <ChooseGateItem 
        show={isModalOpen}
        onClose={() => setModalOpen(false)}
        row={row}
        onSuccess={() => {
          // Add refresh logic if required
          if (table?.options?.meta?.refetch) {
            table.options.meta.refetch();
          }
        }}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
