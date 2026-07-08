// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { Search, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";

import { useAuthContext } from "app/contexts/auth/context";

// ----------------------------------------------------------------------

export default function AddIndent() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const adminId = user?.id || localStorage.getItem("userId");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [addedItems, setAddedItems] = useState([]);
  const [employeeData, setEmployeeData] = useState({ name: "", code: "" });
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [indentTypeOptions, setIndentTypeOptions] = useState([]);
  
  const [formData, setFormData] = useState({
    priority: "5", // Default Normal
    indent_type_id: "2" // Default Existing
  });

  // Fetch initial data (Master Data)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/inventory/indent-master-data");
        if (response.data.status) {
          const { employee, priority, indent_type } = response.data.data;
          setEmployeeData({
            name: employee.employee_name || "",
            code: employee.employee_code || ""
          });
          setPriorityOptions(priority || []);
          setIndentTypeOptions(indent_type || []);
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Item Search
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/inventory/search-item-for-indent?search=${term}`);
      if (response.data.status) {
        setSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }, []);

  const handleAddItem = (item) => {
    const exists = addedItems.some(i => i.subcategory_id === item.id);
    if (exists) {
      toast.error("Item Already Added");
      return;
    }

    const newItem = {
      subcategory_id: item.id,
      name: item.name,
      specification: "",
      quantity: 1,
      unit: item.unit_name || "",
      remark: ""
    };

    setAddedItems(prev => [...prev, newItem]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const updateItemField = (index, field, value) => {
    setAddedItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleRemoveItem = (index) => {
    setAddedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (addedItems.length === 0) {
      toast.error("No Item is Added");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        admin_id: adminId,
        priority: formData.priority,
        indent_type_id: formData.indent_type_id,
        subcategory_id: addedItems.map(i => i.subcategory_id),
        specification: addedItems.map(i => i.specification),
        quantity: addedItems.map(i => i.quantity),
        remark: addedItems.map(i => i.remark)
      };

      const response = await axios.post("/inventory/add-new-indent", payload);
      
      if (response.data.success || response.data.status) {
        toast.success("Requisition created successfully ✅");
        navigate("/dashboards/inventory/purchase-requisition");
      } else {
        toast.error(response.data.message || "Failed to add requisition ❌");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Something went wrong during submission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Add Requisition">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="mr-2 h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading Master Data...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add Requisition">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Add New Requisition
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboards/inventory/purchase-requisition")}
            className="text-white bg-blue-600 hover:bg-blue-700 px-6"
          >
            &lt;&lt; Back to List
          </Button>
        </div>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Info */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Employee Code</label>
                  <input value={employeeData.code} disabled className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name of Employee</label>
                  <input value={employeeData.name} disabled className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Priority <span className="text-red-500">*</span></label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Priority</option>
                    {priorityOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.priority_name}</option>
                    ))}
                  </select>
                </div>

                {/* Indent Type */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">New/Existing <span className="text-red-500">*</span></label>
                  <select
                    value={formData.indent_type_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, indent_type_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {indentTypeOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Search */}
              <div className="space-y-1.5 relative">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search Item <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search by material or service name..."
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {searchResults.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleAddItem(item)}
                        className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-0 flex justify-between items-center group transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600">{item.name}</span>
                        <Plus className="w-4 h-4 text-blue-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-12 text-center">S.No</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Material / Service Name</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-48">Specification</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-28 text-center">Quantity</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-24">Unit</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Remark</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {addedItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-10 text-center text-gray-400 italic">No items added yet.</td>
                      </tr>
                    ) : (
                      addedItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.name}</td>
                          <td className="px-4 py-3">
                            <input
                              value={item.specification}
                              onChange={(e) => updateItemField(index, "specification", e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemField(index, "quantity", e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-center font-bold text-blue-600 dark:border-gray-600 dark:bg-gray-900"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{item.unit || "-"}</td>
                          <td className="px-4 py-3">
                            <input
                              value={item.remark}
                              onChange={(e) => updateItemField(index, "remark", e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-400 hover:text-red-600 p-1.5 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-900/50">
              <Button 
                type="submit" 
                disabled={submitting}
                className={clsx(
                  "!bg-blue-600 !text-white rounded-lg px-10 py-2.5 text-sm font-semibold shadow-md transition hover:!bg-blue-700 active:!bg-blue-800",
                  submitting && "opacity-60 cursor-not-allowed"
                )}
              >
                {submitting ? "Submitting..." : "Submit Requisition"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}