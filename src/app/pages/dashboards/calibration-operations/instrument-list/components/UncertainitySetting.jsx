import { useEffect, useState } from "react";
import axios from "utils/axios";
import { toast } from "react-hot-toast";
import { Button } from "components/ui/button";
import Select from "react-select";
import { UNCERTAINTY_LAYOUTS } from "./UncertaintyLayouts";

const SUFFIX_NAMES = {
  ctg: "Coating Thickness Gauge",
  dpg: "Digital Pressure Gauge",
  mm: "Multimeter",
  odfm: "Optical Dimension Measuring Machine",
  mt: "Measuring Tape",
  it: "Internal Thermometer",
  fg: "Feeler Gauge",
  hg: "Height Gauge",
  avg: "Analogue Vacuum Gauge",
  msr: "Micrometer Setting Rod",
  mg: "Magnehelic Gauge",
  exm: "External Micrometer",
  rtdwi: "RTD Sensor With Indicator",
  ppg: "Precision Pressure Gauge",
  gtm: "Glass Thermometer",
  dg: "Digital Dial Gauge"
};

export default function UncertainitySetting({
  instid,
  formatId,
  formatValue,
  onComplete,
  onBack,
}) {
  const [data, setData] = useState([]);
  const [suffix, setSuffix] = useState(formatValue || "");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [customLayout, setCustomLayout] = useState(null);
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [hasUnsavedHeaders, setHasUnsavedHeaders] = useState(false);
  const [editingHeaderKey, setEditingHeaderKey] = useState(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("");
  const [summaryTypeOptions, setSummaryTypeOptions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeMenuColId, setActiveMenuColId] = useState(null);
  const [deleteColumnKey, setDeleteColumnKey] = useState(null);
  const [editingColumnForModal, setEditingColumnForModal] = useState(null);

  const [columnSource, setColumnSource] = useState("fetch");
  const [referenceColumns, setReferenceColumns] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [referenceSearchQuery, setReferenceSearchQuery] = useState("");
  const [selectedDetailsText, setSelectedDetailsText] = useState("");

  // Data Validation Table State
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationRows, setValidationRows] = useState(1);
  const [validationCols, setValidationCols] = useState(1);
  const [validationHeadings, setValidationHeadings] = useState(["Column 1"]);
  const [extraTables, setExtraTables] = useState([]);
  const [unsavedValidationTables, setUnsavedValidationTables] = useState([]);

  // Validation Table Interactivity State
  const [editingHeadersTableId, setEditingHeadersTableId] = useState(null);
  const [addingColumnTableId, setAddingColumnTableId] = useState(null);
  const [editingValidationHeaderKey, setEditingValidationHeaderKey] = useState(null);
  const [activeValidationMenuColId, setActiveValidationMenuColId] = useState(null);
  const [deleteValidationColumnKey, setDeleteValidationColumnKey] = useState(null);
  const [isAddValidationColumnModalOpen, setIsAddValidationColumnModalOpen] = useState(false);
  const [newValidationColumnName, setNewValidationColumnName] = useState("");
  const [newValidationColumnType, setNewValidationColumnType] = useState("");
  const [editingValidationColumnForModal, setEditingValidationColumnForModal] = useState(null);

  useEffect(() => {
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

  const fetchReferenceColumns = async () => {
    setLoadingReferences(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(
        `/observationlayout/get-formate-layout/${instid}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const resData = response.data;
      if (resData && (resData.success || resData.status === "true" || resData.status === true) && resData.data) {
        const dataVal = resData.data;
        let parsedCols = [];

        if (Array.isArray(dataVal)) {
          parsedCols = dataVal;
        } else if (dataVal && Array.isArray(dataVal.columns)) {
          let columnsArray = dataVal.columns;
          if (columnsArray.length > 0 && columnsArray[0].uncertainty_key && typeof columnsArray[0].uncertainty_key === 'string' && (columnsArray[0].uncertainty_key.startsWith('[') || columnsArray[0].uncertainty_key.startsWith('{'))) {
            try {
              let parsedKey = JSON.parse(columnsArray[0].uncertainty_key);
              if (Array.isArray(parsedKey)) {
                parsedCols = parsedKey;
              } else if (parsedKey && typeof parsedKey === 'object' && parsedKey.columns) {
                parsedCols = parsedKey.columns;
              } else {
                parsedCols = columnsArray;
              }
            } catch (e) {
              console.error("Failed to parse uncertainty_key string as JSON:", e);
              parsedCols = columnsArray;
            }
          } else {
            parsedCols = columnsArray;
          }
        }

        if (Array.isArray(parsedCols)) {
          parsedCols = parsedCols.filter(col => col.column_key !== 'sr_no');
          setReferenceColumns(parsedCols);
        } else {
          setReferenceColumns([]);
        }
      } else {
        setReferenceColumns([]);
      }
    } catch (err) {
      console.error("Failed to fetch reference columns:", err);
      toast.error("Failed to load reference columns.");
    } finally {
      setLoadingReferences(false);
    }
  };

  const createLayoutPayload = (mainCols, extraTablesOverride = null) => {
    let repeatCount = 5;
    const count = mainCols.filter(c => /^[0-9]+$/.test(c.headerName) || /^M[0-9]+$/.test(c.headerName)).length;
    if (count > 0) repeatCount = count;

    const payload = {
      formatId: parseInt(formatId),
      instid: parseInt(instid),
      observation_repeat: repeatCount,
      columns: mainCols.map((col, index) => ({
        column_key: col.key,
        display_name: col.headerName,
        sort_order: index,
        group_name: col.group || null,
      })),
    };

    const tablesToUse = extraTablesOverride || extraTables;
    if (tablesToUse && tablesToUse.length > 0) {
      tablesToUse.forEach(t => {
        payload[t.id] = t.columns.map((col, index) => ({
          column_key: col.key,
          display_name: col.headerName,
          sort_order: index,
          group_name: col.group || null,
          fetched_value: col.fetched_value || "old",
        }));
      });
    }

    return payload;
  };

  const handleAddColumn = async () => {
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
      const prevGroup = newColumns.length > 0 ? newColumns[newColumns.length - 1].group : null;
      const newCol = {
        key: `custom_col_${Date.now()}`,
        originalIndex: newColumns.length,
        headerName: newColumnName,
        group: prevGroup,
      };
      newColumns.push(newCol);
    }

    setCustomLayout({ ...customLayout, columns: newColumns });
    setIsAddColumnModalOpen(false);
    setNewColumnName("");
    setNewColumnType("");
    setEditingColumnForModal(null);
    setIsEditingHeaders(true);

    try {
      const authToken = localStorage.getItem("authToken");
      const payload = createLayoutPayload(newColumns);

      const response = await axios.post("/observationlayout/save-uncertainty-layout", payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success || response.data.status === "true" || response.data.status === true) {
        toast.success(`Column ${editingColumnForModal ? "updated" : "added"} and layout saved successfully!`);
      } else {
        toast.error(`Failed to save layout after ${editingColumnForModal ? "updating" : "adding"} column.`);
      }
    } catch (error) {
      console.error("Error saving layout after modifying column:", error);
      toast.error("An error occurred while saving the layout.");
    }
  };

  const handleDeleteColumn = async (columnKey) => {
    const newColumns = customLayout.columns.filter((col) => col.key !== columnKey);
    setCustomLayout({ ...customLayout, columns: newColumns });
    setActiveMenuColId(null);
    setIsEditingHeaders(true);

    try {
      const authToken = localStorage.getItem("authToken");
      const payload = createLayoutPayload(newColumns);

      const response = await axios.post("/observationlayout/save-uncertainty-layout", payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success || response.data.status === "true" || response.data.status === true) {
        toast.success("Column deleted and layout saved successfully!");
      } else {
        toast.error("Failed to save layout after deleting column.");
      }
    } catch (error) {
      console.error("Error saving layout after deleting column:", error);
      toast.error("An error occurred while saving the layout.");
    }
  };


  const handleSave = async () => {
    if (!formatId) {
      alert("Format ID is missing! Please check the URL parameter.");
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        alert("Authentication token not found! Please login again.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Settings saved successfully!");
      toast.success("Settings saved successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        onComplete(); // Complete all steps
      }, 1500);

    } catch (error) {
      console.error("=== ERROR ===", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLayoutAndData = async () => {
      try {
        setLoading(true);
        const instrumentSuffix = formatValue || "";
        setSuffix(instrumentSuffix);
        console.log("Instrument Suffix:", instrumentSuffix);

        if (instrumentSuffix && UNCERTAINTY_LAYOUTS[instrumentSuffix]) {
          const defaultLayout = UNCERTAINTY_LAYOUTS[instrumentSuffix].map((col, idx) => ({
            key: col.key || `col_${idx}`,
            originalIndex: idx,
            headerName: col.header,
            group: col.group,
            isDefault: true,
          }));
          let loadedLayout = { columns: defaultLayout };

          try {
            const layoutResponse = await axios.get(
              `/observationlayout/get-formate-layout/${instid}`
            );

            let obsRepeat = 5;
            if (
              layoutResponse.data?.data?.columns &&
              layoutResponse.data.data.columns.length > 0 &&
              layoutResponse.data.data.columns[0].observation_repeat !== undefined
            ) {
              obsRepeat = parseInt(layoutResponse.data.data.columns[0].observation_repeat) || 5;
            }

            if (
              layoutResponse.data?.success &&
              layoutResponse.data?.data?.columns &&
              layoutResponse.data.data.columns.length > 0 &&
              layoutResponse.data.data.columns[0].uncertainty_key
            ) {
              const apiLayoutData = layoutResponse.data.data.columns[0];
              let parsedKey = JSON.parse(apiLayoutData.uncertainty_key);

              let mainCols = [];
              let extractedTables = [];

              if (Array.isArray(parsedKey)) {
                mainCols = parsedKey;
              } else if (parsedKey && typeof parsedKey === 'object') {
                mainCols = parsedKey.columns || [];
                Object.keys(parsedKey).forEach(key => {
                  if (key.startsWith('table') && Array.isArray(parsedKey[key])) {
                    extractedTables.push({
                      id: key,
                      name: `Data Table (${key})`,
                      columns: parsedKey[key].map(col => ({
                        key: col.column_key,
                        headerName: col.display_name,
                        group: col.group_name
                      }))
                    });
                  }
                });
              }

              // Transform to match our internal layout structure
              const customCols = mainCols.map(col => {
                const defaultCol = defaultLayout.find(d =>
                  d.key === col.column_key ||
                  `col_${d.originalIndex}` === col.column_key ||
                  (col.column_key.startsWith("col_dyn_") && d.headerName === col.display_name)
                );
                return {
                  key: col.column_key,
                  originalIndex: defaultCol ? defaultCol.originalIndex : -1,
                  headerName: col.display_name,
                  group: col.group_name,
                  isDefault: !!defaultCol
                };
              });
              loadedLayout = { columns: customCols };

              setExtraTables(extractedTables);
            }

            // Dynamically adjust numbered columns (1, 2, 3...) to match observation_repeat
            const adjustNumberedColumns = (cols, repeatCount) => {
              const newCols = [];
              let firstNumIdx = -1;
              let numberColGroup = null;

              // Find the first column named "1"
              for (let i = 0; i < cols.length; i++) {
                if (cols[i].headerName === "1") {
                  firstNumIdx = i;
                  numberColGroup = cols[i].group;
                  break;
                }
              }

              if (firstNumIdx === -1) return cols;

              // Find the range of numbered columns
              let currentNum = 1;
              let lastNumberColIndex = firstNumIdx;
              for (let i = firstNumIdx; i < cols.length; i++) {
                if (cols[i].headerName === String(currentNum)) {
                  lastNumberColIndex = i;
                  currentNum++;
                } else {
                  break;
                }
              }

              const existingNumCount = currentNum - 1;

              for (let j = 0; j < cols.length; j++) {
                if (j === firstNumIdx) {
                  // Insert 1 to repeatCount
                  for (let k = 1; k <= repeatCount; k++) {
                    if (k <= existingNumCount) {
                      newCols.push(cols[firstNumIdx + k - 1]);
                    } else {
                      newCols.push({
                        key: `col_dyn_${Date.now()}_${k}`,
                        originalIndex: -1, // Indicates it's dynamic
                        headerName: String(k),
                        group: numberColGroup
                      });
                    }
                  }
                  j = lastNumberColIndex;
                } else {
                  newCols.push(cols[j]);
                }
              }
              return newCols;
            };

            loadedLayout.columns = adjustNumberedColumns(loadedLayout.columns, obsRepeat);

          } catch (err) {
            console.error("Failed to fetch format layout via new API", err);
          }

          setCustomLayout(loadedLayout);
        }

        // Initialize with 3 empty rows, ensure values array has plenty of items just in case
        const emptyRow = { values: Array(20).fill(""), masterObservations: Array(20).fill("") };
        setData([emptyRow, emptyRow, emptyRow]);

      } catch (err) {
        console.error("Error setting up uncertainty layout:", err);
      } finally {
        setLoading(false);
      }
    };

    if (instid) {
      fetchLayoutAndData();
    }
  }, [instid, formatValue, refreshKey]);

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

  const handleGroupRename = (oldGroupName, newGroupName) => {
    if (!customLayout || oldGroupName === null) return;
    const newColumns = customLayout.columns.map((col) =>
      col.group === oldGroupName ? { ...col, group: newGroupName } : col
    );
    setCustomLayout({ ...customLayout, columns: newColumns });
    setHasUnsavedHeaders(true);
  };

  const saveHeaderEdit = () => {
    setEditingHeaderKey(null);
  };

  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const handleSaveLayout = async () => {
    console.log("handleSaveLayout TRIGGERED!");
    console.log("formatId:", formatId, "instid:", instid);

    if (!formatId) {
      toast.error("Format ID is missing!");
      return;
    }

    setIsSavingLayout(true);
    try {
      const authToken = localStorage.getItem("authToken");

      const payload = createLayoutPayload(customLayout && customLayout.columns ? customLayout.columns : []);

      console.log("Sending payload to /observationlayout/save-uncertainty-layout:", payload);

      const response = await axios.post(
        "/observationlayout/save-uncertainty-layout",
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Save API Response:", response.data);

      if (response.data.success || response.data.status === "true" || response.data.status === true) {
        toast.success("Format layout saved successfully!");
        setIsEditingHeaders(false);
        setHasUnsavedHeaders(false);
      } else {
        toast.error("Failed to save format layout. Please try again.");
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("An error occurred while saving the layout.");
    } finally {
      setIsSavingLayout(false);
    }
  };

  const syncLayoutWithBackend = async (newExtraTables) => {
    try {
      const authToken = localStorage.getItem("authToken");
      const currentCols = customLayout?.columns || [];
      const payload = createLayoutPayload(currentCols, newExtraTables);

      const response = await axios.post("/observationlayout/save-uncertainty-layout", payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!(response.data.success || response.data.status === "true" || response.data.status === true)) {
        toast.error("Failed to sync validation table changes.");
      }
    } catch (error) {
      console.error("Error syncing layout:", error);
      toast.error("An error occurred while syncing layout.");
    }
  };

  // ========================= VALIDATION TABLE HANDLERS ========================= //
  const handleValidationDragStart = (e, key) => {
    e.dataTransfer.setData("text/plain", key);
    e.currentTarget.classList.add("opacity-50", "shadow-lg", "scale-105", "bg-red-50", "z-50");
  };

  const handleValidationDrop = (e, targetKey, tableId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("opacity-50", "shadow-lg", "scale-105", "bg-red-50", "z-50");
    const sourceKey = e.dataTransfer.getData("text/plain");

    if (sourceKey === targetKey) return;

    setExtraTables(prevTables => prevTables.map(table => {
      if (table.id !== tableId) return table;
      const newColumns = [...table.columns];
      const sourceIdx = newColumns.findIndex((c) => c.key === sourceKey);
      const targetIdx = newColumns.findIndex((c) => c.key === targetKey);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const [movedCol] = newColumns.splice(sourceIdx, 1);
        newColumns.splice(targetIdx, 0, movedCol);
      }
      return { ...table, columns: newColumns };
    }));
    
    setUnsavedValidationTables(prev => prev.includes(tableId) ? prev : [...prev, tableId]);
  };

  const handleValidationColumnRename = (key, newName, tableId) => {
    setExtraTables(prevTables => prevTables.map(table => {
      if (table.id !== tableId) return table;
      const updatedCols = table.columns.map((col) =>
        col.key === key ? { ...col, headerName: newName } : col
      );
      return { ...table, columns: updatedCols };
    }));
    setUnsavedValidationTables(prev => prev.includes(tableId) ? prev : [...prev, tableId]);
  };

  const saveValidationHeaderEdit = () => {
    setEditingValidationHeaderKey(null);
  };

  const handleAddValidationColumn = () => {
    if (!newValidationColumnName.trim()) {
      toast.error("Please enter a column name.");
      return;
    }
    if (!newValidationColumnType) {
      toast.error("Please select a column type.");
      return;
    }

    if (!addingColumnTableId) return;

    let updatedTables = [...extraTables];

    const tableIdx = updatedTables.findIndex(t => t.id === addingColumnTableId);
    if (tableIdx === -1) {
      setIsAddValidationColumnModalOpen(false);
      setNewValidationColumnName("");
      setNewValidationColumnType("");
      setEditingValidationColumnForModal(null);
      setAddingColumnTableId(null);
      return;
    }

    const table = updatedTables[tableIdx];
    const newColumns = [...table.columns];

    if (editingValidationColumnForModal) {
      const exists = newColumns.some(c => c.key === newValidationColumnType && c.key !== editingValidationColumnForModal.key);
      if (exists) {
        toast.error("A column of this type already exists.");
        return;
      }
      const idx = newColumns.findIndex(c => c.key === editingValidationColumnForModal.key);
      if (idx !== -1) {
        newColumns[idx] = {
          ...newColumns[idx],
          key: newValidationColumnType,
          headerName: newValidationColumnName.trim()
        };
      }
      toast.success("Validation column updated successfully!");
    } else {
      const exists = newColumns.some(c => c.key === newValidationColumnType);
      if (exists) {
        toast.error("A column of this type already exists.");
        return;
      }
      newColumns.push({
        key: newValidationColumnType,
        headerName: newValidationColumnName.trim(),
      });
      toast.success("Validation column added successfully!");
    }

    updatedTables[tableIdx] = { ...table, columns: newColumns };

    setExtraTables(updatedTables);
    syncLayoutWithBackend(updatedTables);

    setIsAddValidationColumnModalOpen(false);
    setNewValidationColumnName("");
    setNewValidationColumnType("");
    setEditingValidationColumnForModal(null);
    setAddingColumnTableId(null);
  };

  const handleDeleteValidationColumn = (key, tableId) => {
    const updatedTables = extraTables.map(table => {
      if (table.id !== tableId) return table;
      const newColumns = table.columns.filter(c => c.key !== key);
      return { ...table, columns: newColumns };
    });
    setExtraTables(updatedTables);
    syncLayoutWithBackend(updatedTables);
    toast.success("Validation column deleted.");
  };

  // ========================= DYNAMIC TABLE RENDERER ========================= //
  const renderDynamicTable = () => {
    if (!customLayout || !customLayout.columns || customLayout.columns.length === 0) return null;

    const hasGroups = customLayout.columns.some(col => col.group);

    let groupRow = [];
    if (hasGroups) {
      let currentGroup = null;
      let colSpan = 0;

      customLayout.columns.forEach((col) => {
        if (col.group !== currentGroup) {
          if (currentGroup !== null) {
            groupRow.push({ name: currentGroup, colSpan });
          }
          currentGroup = col.group;
          colSpan = 1;
        } else {
          colSpan++;
        }
      });
      if (currentGroup !== null) {
        groupRow.push({ name: currentGroup, colSpan });
      }
    }

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="w-full text-sm border-collapse">
          <thead>
            {hasGroups && (
              <tr className="bg-gray-100 border-b border-gray-300">
                {groupRow.map((group, idx) => (
                  <th key={idx} colSpan={group.colSpan} className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
                    {isEditingHeaders && group.name !== null ? (
                      <textarea
                        value={group.name || ""}
                        onChange={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          handleGroupRename(group.name, e.target.value);
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center bg-white min-w-[120px] w-[90%] resize-none overflow-hidden"
                        rows={1}
                        style={{ minHeight: '32px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      group.name
                    )}
                  </th>
                ))}
              </tr>
            )}
            <tr className="bg-gray-200 text-center text-[12px] font-medium">
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
                                setNewColumnType(col.key || "");
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
                        <textarea
                          value={col.headerName || ""}
                          onChange={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                            handleColumnRename(col.key, e.target.value);
                          }}
                          onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center bg-white min-w-[80px] w-[90%] resize-none overflow-hidden"
                          rows={1}
                          style={{ minHeight: '32px' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute right-1 cursor-grab text-gray-400 opacity-20 select-none text-lg group-hover/handle:opacity-60 transition-opacity" title="Drag column">⠿</div>
                      </div>
                    ) : isEditing ? (
                      <textarea
                        value={col.headerName || ""}
                        onChange={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          handleColumnRename(col.key, e.target.value);
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={saveHeaderEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            saveHeaderEdit();
                          }
                          if (e.key === "Escape") setEditingHeaderKey(null);
                        }}
                        className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none text-center min-w-[80px] resize-none overflow-hidden"
                        rows={1}
                        style={{ minHeight: '32px' }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center justify-center relative group/handle">
                        <span className="px-6 inline-block">
                          {col.headerName.includes("{") ? col.headerName.replace(/\{.*\}/, data[0]?.masterUnit || "bar") : col.headerName}
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
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
                {customLayout.columns.map((col) => {
                  const originalCol = UNCERTAINTY_LAYOUTS[suffix]?.[col.originalIndex];
                  let cellValue = " ";
                  if (originalCol && typeof originalCol.value === 'function') {
                    try {
                      cellValue = originalCol.value(row);
                    } catch {
                      cellValue = " ";
                    }
                  }
                  if (cellValue === undefined || cellValue === null || cellValue === "undefined") {
                    cellValue = " ";
                  }
                  return (
                    <td key={col.key} className="border border-gray-300 px-1 py-2">
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ========================= VALIDATION TABLE RENDERER ========================= //
  const renderExtraTables = () => {
    if (!extraTables || extraTables.length === 0) return null;

    return (
      <div className="space-y-8 mt-8">
        {extraTables.map((table) => {
          const { id: tableId, rows, columns } = table;
          const isEditingHeadersForThisTable = editingHeadersTableId === tableId;
          const hasUnsavedThisTable = unsavedValidationTables.includes(tableId);

          return (
            <div key={tableId} className="rounded-lg bg-white p-6 shadow-md border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{table.name || "Data Validation Settings"}</h3>
                  <p className="text-sm text-gray-500 mt-1">Configure columns and rows for this data validation table.</p>
                </div>
                {(isEditingHeadersForThisTable || hasUnsavedThisTable) ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHeadersTableId(null);
                        setUnsavedValidationTables(prev => prev.filter(id => id !== tableId));
                        syncLayoutWithBackend(extraTables);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-green-600 border-green-600 text-white hover:bg-green-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Save Headers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHeadersTableId(null);
                        setUnsavedValidationTables(prev => prev.filter(id => id !== tableId));
                        // Refresh extra tables to revert unsaved changes by refetching reference columns
                        fetchReferenceColumns();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this Data Validation Table?")) {
                          const updatedTables = extraTables.filter(t => t.id !== tableId);
                          setExtraTables(updatedTables);
                          syncLayoutWithBackend(updatedTables);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete Table
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingValidationColumnForModal(null);
                        setNewValidationColumnName("");
                        setNewValidationColumnType("");
                        setAddingColumnTableId(tableId);
                        setIsAddValidationColumnModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Column
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingHeadersTableId(tableId)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                      Edit Headers
                    </button>
                  </div>
                )}
              </div>

              {(isEditingHeadersForThisTable || hasUnsavedThisTable) && (
                <p className="text-xs text-red-600 font-medium mb-4 bg-red-50 p-2 rounded border border-red-100">
                  💡 Tip: Type directly into any header field to rename it in real-time. Drag and drop the ⠿ handle to reorder columns.
                </p>
              )}

              <div className={`overflow-x-auto border border-red-200 rounded-md transition-all duration-300 ${activeValidationMenuColId ? "pb-32" : ""}`}>
                <table className="w-full text-sm border-collapse bg-white">
                  <thead>
                    <tr className="bg-red-100 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                      {columns.map((col, index) => {
                        const isDraggable = true;
                        const isEditing = editingValidationHeaderKey === col.key;

                        return (
                          <th
                            key={col.key}
                            draggable={isDraggable}
                            onDragStart={(e) => isDraggable && handleValidationDragStart(e, col.key)}
                            onDragOver={(e) => { if (isDraggable) e.preventDefault(); }}
                            onDrop={(e) => isDraggable && handleValidationDrop(e, col.key, tableId)}
                            onDragEnd={(e) => e.currentTarget.classList.remove("opacity-50", "shadow-lg", "scale-105", "bg-red-50", "z-50")}
                            onDoubleClick={() => !isEditingHeadersForThisTable && setEditingValidationHeaderKey(col.key)}
                            className={`relative px-4 py-3 text-red-700 font-semibold text-center whitespace-nowrap border border-red-200 transition-all duration-200 ${isDraggable ? "cursor-grab hover:bg-red-50" : ""} group`}
                          >
                            {!isEditingHeadersForThisTable && !isEditing && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveValidationMenuColId(activeValidationMenuColId === col.key ? null : col.key);
                                  }}
                                  className="p-1 bg-white border border-red-200 rounded shadow-sm text-gray-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                </button>

                                {activeValidationMenuColId === col.key && (
                                  <div className={`absolute top-full mt-1 w-32 bg-white rounded shadow-lg border border-red-200 py-1 z-20 flex flex-col whitespace-normal ${index === 0 ? 'left-0' : 'right-0'}`} onMouseLeave={() => setActiveValidationMenuColId(null)}>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingValidationColumnForModal(col);
                                        setNewValidationColumnName(col.headerName || "");
                                        setNewValidationColumnType(summaryTypeOptions.includes(col.key) ? col.key : "");
                                        setAddingColumnTableId(tableId);
                                        setIsAddValidationColumnModalOpen(true);
                                        setActiveValidationMenuColId(null);
                                      }}
                                    >
                                      Edit Value
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteValidationColumnKey(col.key);
                                        handleDeleteValidationColumn(col.key, tableId);
                                        setActiveValidationMenuColId(null);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {isEditingHeadersForThisTable ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  value={col.headerName || ""}
                                  onChange={(e) => handleValidationColumnRename(col.key, e.target.value, tableId)}
                                  className="px-2 py-1 text-xs border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-center bg-white min-w-[80px]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="cursor-grab text-red-400 select-none text-lg" title="Drag column">⠿</div>
                              </div>
                            ) : isEditing ? (
                              <input
                                type="text"
                                value={col.headerName || ""}
                                onChange={(e) => handleValidationColumnRename(col.key, e.target.value, tableId)}
                                onBlur={saveValidationHeaderEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveValidationHeaderEdit();
                                  if (e.key === "Escape") setEditingValidationHeaderKey(null);
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none text-center min-w-[80px] text-gray-900"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div className="flex items-center justify-center relative group/handle">
                                <span className="px-6 inline-block">
                                  {col.headerName}
                                </span>
                                {isDraggable && (
                                  <div className="absolute right-1 cursor-grab text-red-400 opacity-20 select-none text-lg group-hover/handle:opacity-60 transition-opacity" title="Drag column">⠿</div>
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-100">
                    {Array.from({ length: rows }).map((_, rIdx) => (
                      <tr key={rIdx} className="hover:bg-red-50/50">
                        {columns.map((col) => (
                          <td key={col.key} className="border border-red-200 px-2 py-2">
                            <input
                              type="text"
                              disabled
                              className="w-full bg-transparent border-none text-center focus:ring-0 text-red-600 placeholder-red-300"
                              placeholder="--"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading Uncertainty Calculation...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between p-4 border-b bg-white rounded-lg shadow-sm mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Uncertainity Settings</h1>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="mb-4 border-b pb-3">
          {suffix && (
            <h2 className="text-xl font-medium text-gray-800 mb-3">
              Table: {SUFFIX_NAMES[suffix] ? `${SUFFIX_NAMES[suffix]} (${suffix.toUpperCase()})` : suffix.toUpperCase()}
            </h2>
          )}

          {customLayout && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded border border-blue-100">
                💡 Tip: {(isEditingHeaders || hasUnsavedHeaders) ? "Type directly into any header to rename it." : "Click 'Edit Headers' to rename headings, or drag and drop headers to change column positions."}
              </p>
              {(isEditingHeaders || hasUnsavedHeaders) ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveLayout}
                    disabled={isSavingLayout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-green-600 border-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isSavingLayout ? "Saving..." : "Save Headers"}
                  </button>
                  <button
                    type="button"
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
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationRows(1);
                      setValidationCols(1);
                      setValidationHeadings(["Column 1"]);
                      setIsValidationModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create Table
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingColumnForModal(null);
                      setNewColumnName("");
                      setNewColumnType("");
                      setIsAddColumnModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Column
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingHeaders(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                    Edit Headers
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {renderDynamicTable()}
        {renderExtraTables()}

        {customLayout && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setValidationRows(1);
                setValidationCols(1);
                setValidationHeadings(["Column 1"]);
                setIsValidationModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg shadow-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all hover:scale-[1.02]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Table
            </button>
          </div>
        )}

        {(!customLayout && !["ctg", "dpg", "mm", "odfm", "mt", "it", "fg", "hg", "avg", "msr", "mg", "exm", "rtdwi", "ppg", "gtm", "dg"].includes(suffix)) && (
          <div className="text-center py-8 text-gray-500">
            No table available for suffix: {suffix}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-row items-center justify-between gap-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-md bg-gray-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Back
        </Button>

        <button
          onClick={handleSave}
          disabled={loading}
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
          className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
              </svg>
              Saving...
            </div>
          ) : (
            "Complete & Finish"
          )}
        </button>
      </div>

      {/* Add / Edit Column Modal */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`bg-white rounded-lg p-6 shadow-xl transition-all ${columnSource === "reference" ? "w-[700px]" : "w-[400px]"}`}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingColumnForModal ? "Edit Column" : "Add New Column"}</h3>

            {!editingColumnForModal ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Enter heading name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-4 border-b pb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="columnSource"
                      checked={columnSource === "fetch"}
                      onChange={() => setColumnSource("fetch")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Fetch Value</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="columnSource"
                      checked={columnSource === "reference"}
                      onChange={() => {
                        setColumnSource("reference");
                        fetchReferenceColumns();
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Reference</span>
                  </label>
                </div>

                {columnSource === "fetch" ? (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                      <Select
                        value={newColumnType ? { value: newColumnType, label: newColumnType } : null}
                        onChange={(selected) => {
                          const val = selected ? selected.value : "";
                          setNewColumnType(val);
                          if (!newColumnName) setNewColumnName(val);
                        }}
                        options={summaryTypeOptions.map((opt) => ({ value: opt, label: opt }))}
                        placeholder="Select Type"
                        isClearable
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex gap-6 mb-6">
                    <div className="flex-1 border-r pr-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Selected Details</h4>
                      <div className="mb-4">
                        <textarea
                          placeholder="New input..."
                          value={selectedDetailsText}
                          onChange={(e) => setSelectedDetailsText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">
                          Reference Columns
                          {loadingReferences && <span className="text-xs text-blue-600 font-normal ml-2">Loading...</span>}
                        </h4>
                        <input
                          type="text"
                          placeholder="Search..."
                          value={referenceSearchQuery}
                          onChange={(e) => setReferenceSearchQuery(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto border border-gray-200 rounded-md">
                        {referenceColumns.filter(col => col.display_name.toLowerCase().includes(referenceSearchQuery.toLowerCase()) || col.column_key.toLowerCase().includes(referenceSearchQuery.toLowerCase())).length > 0 ? (
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                              <tr>
                                <th className="px-3 py-2 font-medium text-gray-600">Name</th>
                                <th className="px-3 py-2 font-medium text-gray-600">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {referenceColumns.filter(col => col.display_name.toLowerCase().includes(referenceSearchQuery.toLowerCase()) || col.column_key.toLowerCase().includes(referenceSearchQuery.toLowerCase())).map((col) => (
                                <tr
                                  key={col.column_key}
                                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${newColumnType === col.column_key ? 'bg-blue-100' : ''}`}
                                  onClick={() => {
                                    setNewColumnName(col.display_name);
                                    setNewColumnType(col.column_key);
                                    setSelectedDetailsText((prev) => prev + (prev ? " " : "") + "$" + col.column_key);
                                  }}
                                >
                                  <td className="px-3 py-2 text-gray-800">{col.display_name}</td>
                                  <td className="px-3 py-2 text-gray-500 text-xs font-mono">{col.column_key}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : !loadingReferences ? (
                          <div className="p-4 text-center text-sm text-gray-500">No references found.</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsAddColumnModalOpen(false);
                  setColumnSource("fetch");
                }}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => {
                  handleAddColumn();
                  setColumnSource("fetch");
                }}
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

      {successMessage && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-2xl">
            {successMessage}
          </div>
        </div>
      )}

      {/* Create Validation Table Modal */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center gap-3 border-b pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Validation Table</h3>
                <p className="text-sm text-gray-500">Configure rows, columns, and headings.</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rows</label>
                <input
                  type="number"
                  min="1"
                  value={validationRows}
                  onChange={(e) => setValidationRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Columns</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={validationCols}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(15, parseInt(e.target.value) || 1));
                    setValidationCols(val);
                    setValidationHeadings((prev) => {
                      const newHeadings = [...prev];
                      if (val > newHeadings.length) {
                        for (let i = newHeadings.length; i < val; i++) newHeadings.push(`Column ${i + 1}`);
                      } else if (val < newHeadings.length) {
                        newHeadings.splice(val);
                      }
                      return newHeadings;
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Column Headings</label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {validationHeadings.map((heading, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => {
                        const newHeadings = [...validationHeadings];
                        newHeadings[idx] = e.target.value;
                        setValidationHeadings(newHeadings);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                      placeholder={`Column ${idx + 1} Name`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsValidationModalOpen(false)}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 shadow-sm"
                onClick={() => {
                  const colsWithKeys = validationHeadings.map((h, i) => ({
                    key: `val_col_${Date.now()}_${i}`,
                    headerName: h,
                  }));
                  const newTableId = `table${extraTables.length + 1}`;
                  const newTableData = {
                    id: newTableId,
                    name: `Data Table (${newTableId})`,
                    rows: validationRows,
                    cols: validationCols,
                    columns: colsWithKeys,
                  };
                  const updatedTables = [...extraTables, newTableData];
                  setExtraTables(updatedTables);
                  setIsValidationModalOpen(false);
                  syncLayoutWithBackend(updatedTables);
                }}
              >
                Generate Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Validation Column Modal */}
      {isAddValidationColumnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingValidationColumnForModal ? "Edit Validation Column" : "Add Validation Column"}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Column Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newValidationColumnName}
                onChange={(e) => setNewValidationColumnName(e.target.value)}
                placeholder="Enter column name"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
              <Select
                value={newValidationColumnType ? { value: newValidationColumnType, label: newValidationColumnType } : null}
                onChange={(selected) => setNewValidationColumnType(selected ? selected.value : "")}
                options={summaryTypeOptions.map((opt) => ({ value: opt, label: opt }))}
                placeholder="Select Type"
                isClearable
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsAddValidationColumnModalOpen(false);
                  setNewValidationColumnName("");
                  setNewValidationColumnType("");
                }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleAddValidationColumn}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {editingValidationColumnForModal ? "Save Changes" : "Add Column"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Validation Column Confirmation Modal */}
      {deleteValidationColumnKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Validation Column</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this validation column? This action cannot be undone.</p>

            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDeleteValidationColumnKey(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={() => {
                  handleDeleteValidationColumn(deleteValidationColumnKey);
                  setDeleteValidationColumnKey(null);
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