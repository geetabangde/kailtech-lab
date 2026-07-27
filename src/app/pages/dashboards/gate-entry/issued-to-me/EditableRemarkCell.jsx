import { useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";

export function EditableRemarkCell({ getValue, row, column, table }) {
  const initialValue = getValue() || "";
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.post(`/gate-entry/save-gate-entry-remark`, {
        id: row.original.id,
        remark: value
      });
      if (response.data.status === "true" || response.data.status === true) {
        toast.success("Remark updated successfully");
        table.options.meta?.updateData(row.index, column.id, value);
      } else {
        toast.error(response.data.message || "Failed to update remark");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the remark");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <textarea
        className="w-full sm:w-32 md:w-48 text-xs rounded-md border border-gray-300 p-1.5 focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-900"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder="Add remark..."
      />
      <Button
        size="sm"
        variant="outline"
        className="px-2 py-1 h-auto text-[10px] sm:text-xs"
        onClick={onSave}
        disabled={isSaving || value === initialValue}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

