// Import Dependencies
import { MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRef, useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";

import { Button, Input } from "components/ui";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const permissions = getStoredPermissions();
  const canUpload = permissions.includes(230);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("attendance_file", file);

    setUploading(true);
    try {
      await axios.post("/hrm/upload-attendance-sheet", formData);
      toast.success("Attendance sheet uploaded successfully ✅");
      table.options.meta?.fetchData?.(); // Refresh table data
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.response?.data?.message || "Failed to upload attendance sheet ❌");
    } finally {
      setUploading(false);
      e.target.value = ""; // Clear input
    }
  };

  return (
    <div className="table-toolbar px-[var(--margin-x)] pt-4">
      <div
        className={clsx(
          "transition-content flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            View All Attendance
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Format */}
          <a 
            href="/demoformats/attendancesheettoUpload.xlsx" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="h-9 rounded-md px-4 text-sm font-medium gap-2"
            >
              <ArrowDownTrayIcon className="size-4" />
              Download Excel Format
            </Button>
          </a>

          {/* Upload Attendance */}
          {canUpload && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <Button
                className="h-9 rounded-md px-4 text-sm font-medium gap-2"
                color="primary"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <ArrowUpTrayIcon className="size-4" />
                {uploading ? "Uploading..." : "Upload Attendance"}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 space-x-2">
        <SearchInput table={table} />
      </div>
    </div>
  );
}

function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "h-9 text-sm ring-primary-500/50 focus:ring-3 w-64",
        root: "shrink-0",
      }}
      placeholder="Search records..."
    />
  );
}
