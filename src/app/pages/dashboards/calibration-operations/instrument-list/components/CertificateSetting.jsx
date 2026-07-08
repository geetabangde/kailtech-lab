import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "components/ui/button";
import Select from "react-select";
import axios from "utils/axios";

// 1. Define all your different table layouts in a configuration object
const CERTIFICATE_LAYOUTS = {
  ctg: {
    columns: [
      { key: "sr_no", headerName: "Sr. No.", fetched_value: "old" },
      { key: "nominal_value", headerName: "Nominal Value", fetched_value: "old" },
      { key: "reading_uuc", headerName: "Reading on UUC", fetched_value: "old" },
      { key: "error", headerName: "Error", fetched_value: "old" },
    ],
    hasMeasurementUncertainty: true,
    hasParallelism: true,
  },
  dpg: {
    columns: [
      { key: "sr_no", headerName: "Sr. No.", fetched_value: "old" },
      { key: "set_pressure", headerName: "Set Pressure on UUC", fetched_value: "old" },
      { key: "avg_master", headerName: "Average on Master", fetched_value: "old" },
      { key: "error", headerName: "Error", fetched_value: "old" },
      { key: "hysterisis", headerName: "Hysterisis", fetched_value: "old" },
    ],
    hasMeasurementUncertainty: true,
    hasParallelism: false,
  },
};

const DEFAULT_LAYOUT = {
  columns: [
    { key: "sr_no", headerName: "Sr. No.", fetched_value: "old" },
    { key: "value", headerName: "Value", fetched_value: "old" }
  ],
  hasMeasurementUncertainty: false,
  hasParallelism: false,
};

export default function CertificateSetting({
  instid,
  formatId,
  formatValue, // This will be 'ctg', 'dpg', etc.
  onComplete,
  onBack,
}) {
  // TODO: Use instid and formatId when implementing the API save endpoint
  console.log("Initialized Certificate Builder for Inst:", instid, "Format:", formatId);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Interactive State
  const [customLayout, setCustomLayout] = useState(null);
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [hasUnsavedHeaders, setHasUnsavedHeaders] = useState(false);
  const [editingHeaderKey, setEditingHeaderKey] = useState(null);
  const [activeMenuColId, setActiveMenuColId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("");
  const [editingColumnForModal, setEditingColumnForModal] = useState(null);
  const [deleteColumnKey, setDeleteColumnKey] = useState(null);
  const [summaryTypeOptions, setSummaryTypeOptions] = useState([]);

  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [observationRepeat, setObservationRepeat] = useState(10);

  useEffect(() => {
    // Fetch Column Types
    const fetchTypes = async () => {
      try {
        const response = await axios.get("/observationsetting/get-all-summary-type");
        if (response.data && response.data.new_summary) {
          setSummaryTypeOptions(response.data.new_summary);
        }
      } catch (err) {
        console.error("Failed to fetch summary types:", err);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(`/observationlayout/get-formate-layout/${instid}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          if (data.columns && data.columns.length > 0) {
            const firstCol = data.columns[0];
            if (firstCol.observation_repeat !== undefined) {
              setObservationRepeat(parseInt(firstCol.observation_repeat));
            }
            if (firstCol.certificate_key) {
              let parsedColumns = [];
              try {
                parsedColumns = JSON.parse(firstCol.certificate_key);
              } catch (e) {
                console.error("Failed to parse certificate_key:", e);
              }
              if (parsedColumns.length > 0) {
                const mappedColumns = parsedColumns.map((col) => ({
                  key: col.column_key,
                  headerName: col.display_name,
                  fetched_value: col.fetched_value || "old",
                  group_name: col.group_name || null,
                }));
                const baseLayout = CERTIFICATE_LAYOUTS[formatValue] || DEFAULT_LAYOUT;
                setCustomLayout({
                  ...baseLayout,
                  columns: mappedColumns,
                });
                return; // Early return to avoid setting base layout
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch custom certificate layout:", err);
      }

      // Fallback if no backend layout or request fails
      const baseLayout = CERTIFICATE_LAYOUTS[formatValue] || DEFAULT_LAYOUT;
      setCustomLayout({ ...baseLayout });
    };

    if (instid) {
      fetchLayout();
    } else {
      const baseLayout = CERTIFICATE_LAYOUTS[formatValue] || DEFAULT_LAYOUT;
      setCustomLayout({ ...baseLayout });
    }
  }, [formatValue, instid, refreshKey]);

  useEffect(() => {
    if (!customLayout) return;
    // Mock row data based on the selected layout structure
    const emptyRow = {};
    customLayout.columns.forEach(col => {
      emptyRow[col.key] = "";
    });
    setData([emptyRow, emptyRow, emptyRow]);
  }, [customLayout]);

  // ========================= DRAG AND DROP HANDLERS ========================= //
  const handleDragStart = (e, columnKey) => {
    e.dataTransfer.setData("text/plain", columnKey);
    e.currentTarget.classList.add("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetColumnKey) => {
    e.preventDefault();
    e.currentTarget.classList.remove("opacity-50");
    const sourceColumnKey = e.dataTransfer.getData("text/plain");

    if (sourceColumnKey === targetColumnKey || !customLayout) return;

    const newColumns = [...customLayout.columns];
    const sourceIndex = newColumns.findIndex((col) => col.key === sourceColumnKey);
    const targetIndex = newColumns.findIndex((col) => col.key === targetColumnKey);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [movedColumn] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(targetIndex, 0, movedColumn);

    setCustomLayout({ ...customLayout, columns: newColumns });
    setHasUnsavedHeaders(true);
  };

  const handleColumnRename = (columnKey, newName) => {
    if (!customLayout) return;
    const newColumns = customLayout.columns.map((col) =>
      col.key === columnKey ? { ...col, headerName: newName } : col
    );
    setCustomLayout({ ...customLayout, columns: newColumns });
    setHasUnsavedHeaders(true);
  };

  const saveHeaderEdit = () => {
    setEditingHeaderKey(null);
  };

  // ========================= MODAL HANDLERS ========================= //
  const handleAddColumn = () => {
    if (editingColumnForModal) {
      if (!newColumnName || !newColumnType) {
        toast.error("Please enter both Heading Name and Type.");
        return;
      }
    } else {
      if (!newColumnName) {
        toast.error("Please enter a Heading Name.");
        return;
      }
    }

    const newColumns = [...(customLayout?.columns || [])];

    if (editingColumnForModal) {
      const exists = newColumns.some(col => col.key === newColumnType && col.key !== editingColumnForModal.key);
      if (exists) {
        toast.error("A column of this type already exists.");
        return;
      }
      const idx = newColumns.findIndex(col => col.key === editingColumnForModal.key);
      if (idx !== -1) {
        newColumns[idx] = {
          ...newColumns[idx],
          key: newColumnType,
          headerName: newColumnName,
        };
      }
    } else {
      const newCol = {
        key: `custom_col_${Date.now()}`,
        headerName: newColumnName,
      };
      newColumns.push(newCol);
    }

    setCustomLayout({ ...customLayout, columns: newColumns });
    setIsAddColumnModalOpen(false);
    setNewColumnName("");
    setNewColumnType("");
    setEditingColumnForModal(null);
    toast.success(`Column ${editingColumnForModal ? "updated" : "added"} locally!`);
    setIsEditingHeaders(true);
  };

  const handleDeleteColumn = (columnKey) => {
    const newColumns = customLayout.columns.filter((col) => col.key !== columnKey);
    setCustomLayout({ ...customLayout, columns: newColumns });
    setActiveMenuColId(null);
    toast.success("Column deleted locally!");
    setIsEditingHeaders(true);
  };

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const payload = {
        formatId: parseInt(formatId) || formatId,
        instid: parseInt(instid) || instid,
        observation_repeat: observationRepeat,
        columns: customLayout.columns.map((col, idx) => ({
          column_key: col.key,
          display_name: col.headerName,
          sort_order: idx,
          group_name: col.group_name || null,
          fetched_value: col.fetched_value || "new"
        }))
      };

      const response = await axios.post("/observationlayout/save-certificate-layout", payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && (response.data.success || response.data.status === "true" || response.data.status === true)) {
        toast.success("Certificate layout saved successfully!");
        setIsEditingHeaders(false);
        setHasUnsavedHeaders(false);
      } else {
        toast.error(response.data?.message || "Failed to save certificate layout.");
      }
    } catch (error) {
      console.error("Error saving certificate layout:", error);
      toast.error(error.response?.data?.message || "An error occurred while saving the layout.");
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Final save action if needed before proceeding
      toast.success("Settings saved successfully!");
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error) {
      console.error("Error saving certificate settings:", error);
      toast.error("Failed to save certificate settings");
    } finally {
      setLoading(false);
    }
  };

  if (!customLayout) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Certificate Table Configuration ({formatValue ? formatValue.toUpperCase() : "Default"})
        </h2>
      </div>

      {/* Tip Bar matching UncertainitySetting */}
      <div className="flex items-center gap-4 mb-4">
        {/* Tip Box */}
        <div className="flex-1 flex items-center gap-2 bg-[#f4f8ff] border border-[#d2e3fc] px-4 py-2 rounded-md text-[#1a73e8]">
          <span className="text-base">💡</span>
          <p className="text-sm">
            <span className="font-semibold">Tip:</span> {(isEditingHeaders || hasUnsavedHeaders) ? "Type directly into any header to rename it." : "Click 'Edit Headers' to rename headings, or drag and drop headers to change column positions."}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              setEditingColumnForModal(null);
              setNewColumnName("");
              setNewColumnType("");
              setIsAddColumnModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1a73e8] bg-[#f4f8ff] border border-[#d2e3fc] rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            <span className="text-lg leading-none font-light">+</span> Add Column
          </button>

          <button
            onClick={() => {
              if (isEditingHeaders || hasUnsavedHeaders) {
                handleSaveLayout();
              } else {
                setIsEditingHeaders(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md transition-colors whitespace-nowrap ${(isEditingHeaders || hasUnsavedHeaders)
              ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
              : "text-[#1a73e8] bg-[#f4f8ff] border-[#d2e3fc] hover:bg-blue-100"
              }`}
          >
            {(isEditingHeaders || hasUnsavedHeaders) ? (
              <>
                {isSavingLayout ? "Saving..." : "Save Layout"}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Headers
              </>
            )}
          </button>

          {(isEditingHeaders || hasUnsavedHeaders) && (
            <button
              onClick={() => {
                setIsEditingHeaders(false);
                setHasUnsavedHeaders(false);
                setRefreshKey((prev) => prev + 1);
              }}
              disabled={isSavingLayout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="w-full text-sm border-collapse bg-white">
          <thead>
            <tr className="bg-gray-200 text-center text-[12px] font-medium border-b border-gray-300">
              {customLayout.columns.map((col, index) => {
                const isDraggable = true;
                const isEditing = editingHeaderKey === col.key;

                return (
                  <th
                    key={col.key}
                    draggable={isDraggable}
                    onDragStart={(e) => isDraggable && handleDragStart(e, col.key)}
                    onDragOver={(e) => isDraggable && handleDragOver(e)}
                    onDrop={(e) => isDraggable && handleDrop(e, col.key)}
                    onDragEnd={(e) => e.currentTarget.classList.remove("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50")}
                    onDoubleClick={() => !(isEditingHeaders || hasUnsavedHeaders) && setEditingHeaderKey(col.key)}
                    className={`relative px-3 py-2 text-center border border-gray-300 transition-all duration-200 ${isDraggable ? "cursor-grab hover:bg-gray-50" : ""} group`}
                  >
                    {!isEditingHeaders && !isEditing && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuColId(activeMenuColId === col.key ? null : col.key);
                          }}
                          className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                        </button>

                        {activeMenuColId === col.key && (
                          <div className={`absolute top-full mt-1 w-32 bg-white rounded shadow-lg border border-gray-200 py-1 z-20 ${index === 0 ? 'left-0' : 'right-0'}`} onMouseLeave={() => setActiveMenuColId(null)}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingHeaderKey(col.key);
                                setActiveMenuColId(null);
                              }}
                            >
                              Edit Name
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingColumnForModal(col);
                                setNewColumnName(col.headerName || "");
                                setNewColumnType(col.key && !col.key.startsWith('custom_col_') ? col.key : "");
                                setIsAddColumnModalOpen(true);
                                setActiveMenuColId(null);
                              }}
                            >
                              Edit Value
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteColumnKey(col.key);
                                setActiveMenuColId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {isEditingHeaders ? (
                      <div className="flex items-center justify-center gap-1 relative group/handle">
                        <input
                          type="text"
                          value={col.headerName || ""}
                          onChange={(e) => handleColumnRename(col.key, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center bg-white min-w-[80px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute right-1 cursor-grab text-gray-400 opacity-20 select-none text-lg group-hover/handle:opacity-60 transition-opacity" title="Drag column">⠿</div>
                      </div>
                    ) : isEditing ? (
                      <input
                        type="text"
                        value={col.headerName || ""}
                        onChange={(e) => handleColumnRename(col.key, e.target.value)}
                        onBlur={saveHeaderEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveHeaderEdit();
                          if (e.key === "Escape") setEditingHeaderKey(null);
                        }}
                        className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none text-center min-w-[80px]"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center justify-center relative group/handle">
                        <span className="px-6 inline-block">
                          {col.headerName}
                        </span>
                        {isDraggable && (
                          <div className="absolute right-1 cursor-grab text-gray-400 opacity-20 select-none text-lg group-hover/handle:opacity-60 transition-opacity" title="Drag column">⠿</div>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {customLayout.columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-center border-r border-gray-300 last:border-r-0">
                    <div className="text-gray-400 italic">
                      {col.key === "sr_no" ? i + 1 : "Static Val"}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            {customLayout.hasMeasurementUncertainty && (
              <tr className="bg-gray-50">
                <td colSpan={customLayout.columns.length} className="px-4 py-3 text-left font-semibold text-gray-700 border-t border-gray-300">
                  Measurement Uncertainty: (±µm) <span className="font-normal text-blue-600">[Dynamic CMC Max Value]</span>
                </td>
              </tr>
            )}
            {customLayout.hasParallelism && (
              <tr className="bg-gray-50">
                <td colSpan={customLayout.columns.length} className="px-4 py-3 text-left font-semibold text-gray-700 border-t border-gray-300">
                  Parallelism Of Spindle & anvil: <span className="font-normal text-blue-600">[Dynamic Parallinternal Value] µm</span>
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Go Back
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save & Complete"}
        </button>
      </div>

      {/* Add / Edit Column Modal */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 shadow-xl transition-all w-[400px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingColumnForModal ? "Edit Column" : "Add New Column"}</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter heading name"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {editingColumnForModal && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <Select
                  value={newColumnType ? { value: newColumnType, label: newColumnType } : null}
                  onChange={(selected) => {
                    const val = selected ? selected.value : "";
                    setNewColumnType(val);
                    // Only auto-fill if the user hasn't typed a custom heading name yet
                    if (!newColumnName) {
                      setNewColumnName(val);
                    }
                  }}
                  options={summaryTypeOptions.map((opt) => ({ value: opt, label: opt }))}
                  placeholder="Select Type"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsAddColumnModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={handleAddColumn}
              >
                {editingColumnForModal ? "Save Changes" : "Save Column"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Column Confirmation Modal */}
      {deleteColumnKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Column</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this column? This action cannot be undone.</p>

            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDeleteColumnKey(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={() => {
                  handleDeleteColumn(deleteColumnKey);
                  setDeleteColumnKey(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
