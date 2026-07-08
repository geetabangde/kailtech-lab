// Import Dependencies
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

// Local Imports
import { Card, Button, ReactSelect as Select } from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function AddIndent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState({
    emp_code: "",
    emp_name: "",
    admin_id: "",
    priorities: [],
    indentTypes: [],
  });
  
  const [items, setItems] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      priority: "",
      indent_type_id: "",
    }
  });

  // Fetch initial form data (employees, priorities, types)
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await axios.get("inventory/get-indent-form-data");
        if (response.data.status) {
          setPageData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };
    fetchFormData();
  }, []);

  // Handle item search (equivalent to search_item_for_indent.php)
  const handleSearch = async (inputValue) => {
    if (!inputValue || inputValue.length < 3) return;
    try {
      setIsSearching(true);
      const response = await axios.post("inventory/search-item-for-indent", {
        search: inputValue
      });
      if (response.data) {
        setSearchOptions(response.data.map(item => ({
          value: item.id, // subcategory_id
          label: item.name,
          data: item
        })));
      }
    } catch (err) {
      console.error("Error searching items:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectItem = (selectedOption) => {
    if (!selectedOption) return;

    // Check if item is already added
    const isAdded = items.some(item => item.id === selectedOption.value);
    if (isAdded) {
      toast.error("Item Already Added");
      return;
    }

    // Add item to list
    setItems(prev => [...prev, {
      id: selectedOption.value,
      name: selectedOption.data.name,
      specification: selectedOption.data.specification || "",
      quantity: 1,
      unit: selectedOption.data.unit || "",
      remark: ""
    }]);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const onSubmit = async (formData) => {
    if (items.length === 0) {
      toast.error("No Item is Added");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        admin_id: pageData.admin_id,
        priority: formData.priority,
        indent_type_id: formData.indent_type_id,
        items: items
      };

      const response = await axios.post("inventory/insert-indent", payload);

      if (response.data.status) {
        toast.success(response.data.message || "Requisition added successfully");
        navigate("/dashboards/inventory/view-indent");
      } else {
        toast.error(response.data.message || "Failed to add requisition");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Requisition">
      <div className="transition-content w-full pb-5">
        <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
          <div className="border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
              Add Requisition
            </h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 sm:p-5 space-y-8">
              
              {/* Requisition Information */}
              <div>
                <h5 className="mb-4 text-base font-bold text-gray-800 dark:text-gray-100">
                  Requisition Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Employee Code
                    </label>
                    <input
                      type="text"
                      disabled
                      value={pageData.emp_code}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name of Employee
                    </label>
                    <input
                      type="text"
                      disabled
                      value={pageData.emp_name}
                      placeholder="Company or Requisition Name"
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Controller
                      name="priority"
                      control={control}
                      rules={{ required: "Priority is required" }}
                      render={({ field, fieldState }) => (
                        <Select
                          {...field}
                          id="priority"
                          label="Priority"
                          placeholder="Select Priority"
                          options={pageData.priorities.map(p => ({ value: p.id, label: p.priority_name }))}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Controller
                      name="indent_type_id"
                      control={control}
                      rules={{ required: "New/Existing type is required" }}
                      render={({ field, fieldState }) => (
                        <Select
                          {...field}
                          id="indent_type_id"
                          label="New/Existing"
                          placeholder="Select Indent Type"
                          options={pageData.indentTypes.map(t => ({ value: t.id, label: t.name }))}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Search Any Item
                    </label>
                    <Select
                      placeholder="Type at least 3 characters to search..."
                      options={searchOptions}
                      isLoading={isSearching}
                      onInputChange={(val) => handleSearch(val)}
                      onChange={(val) => handleSelectItem(val)}
                      value={null} // Reset after selection
                    />
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div>
                <h5 className="mb-4 text-base font-bold text-gray-800 dark:text-gray-100">
                  Product Details
                </h5>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-dark-800 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3 w-[50px]">S.no</th>
                        <th className="px-4 py-3">Material / Services Name</th>
                        <th className="px-4 py-3 w-[200px]">Specification</th>
                        <th className="px-4 py-3 w-[150px]">Quantity</th>
                        <th className="px-4 py-3 w-[100px]">Unit</th>
                        <th className="px-4 py-3">Remark</th>
                        <th className="px-4 py-3 text-center w-[80px]">Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            No items added yet. Search and select above.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr key={item.id} className="border-t border-gray-200 dark:border-dark-600">
                            <td className="px-4 py-3 font-medium">{index + 1}</td>
                            <td className="px-4 py-3">{item.name}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.specification}
                                onChange={(e) => updateItem(index, 'specification', e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-600 dark:bg-dark-800"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-600 dark:bg-dark-800"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-600 dark:bg-dark-800"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.remark}
                                onChange={(e) => updateItem(index, 'remark', e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-600 dark:bg-dark-800"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-800/50 sm:px-5">
              <Button
                component={Link}
                to="/dashboards/inventory/view-indent"
                color="secondary"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                loading={loading}
                className="px-8"
              >
                Submit
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
