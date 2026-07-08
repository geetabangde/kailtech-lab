import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button, Input, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";

export default function AddPermission() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [modules, setModules] = useState([]);
  const [fetchingModules, setFetchingModules] = useState(false);
  const [allModulesRaw, setAllModulesRaw] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module: "",
  });

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setFetchingModules(true);
        const response = await axios.get("rolemanagment/get-module");
        if (response.data && (response.data.status === true || response.data.status === "true")) {
          setAllModulesRaw(response.data.data);
          const mappedModules = response.data.data.map(m => ({
            label: m.name,
            value: m.name
          }));
          setModules(mappedModules);
        }
      } catch (err) {
        console.error("Critical error fetching modules:", err);
      } finally {
        setFetchingModules(false);
      }
    };
    fetchModules();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Permission Name is required";
    if (!formData.module) newErrors.module = "Please select a module";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedModule = allModulesRaw.find(m => m.name === formData.module);

      const payload = {
        name: formData.name,
        description: formData.description,
        module: selectedModule ? Number(selectedModule.id) : "",
      };

      await axios.post("rolemanagment/create-permission", payload);

      toast.success("Permission created successfully ✅");
      navigate("/dashboards/role-management/permissions");
    } catch (err) {
      console.error("Error creating permission:", err);
      toast.error(err?.response?.data?.message || "Failed to create permission");
    } finally {
      setLoading(false);
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderColor: errors.module ? '#ef4444' : state.isFocused ? '#3b82f6' : 'rgb(209 213 219)',
      boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.5)' : 'none',
      '&:hover': {
        borderColor: errors.module ? '#ef4444' : '#3b82f6'
      },
      backgroundColor: 'white',
      borderRadius: '0.5rem',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      zIndex: 99,
    }),
  };

  return (
    <Page title="Add Permission">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Add New Permission
            </h1>
          </div>
          <Button
            variant="flat"
            onClick={() => navigate("/dashboards/role-management/permissions")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Permissions
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Permission Name"
                      name="name"
                      placeholder="Enter Permission Name"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                    />
                  </div>
                  <div>
                    <Input
                      label="Permission Description/Symbol"
                      name="description"
                      placeholder="Enter Permission Description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Module <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={modules}
                      value={modules.find(opt => opt.value === formData.module) || null}
                      onChange={(selected) => {
                        setFormData((prev) => ({ ...prev, module: selected ? selected.value : "" }));
                        if (errors.module) setErrors((prev) => ({ ...prev, module: "" }));
                      }}
                      placeholder={fetchingModules ? "Loading modules..." : "Search and Select Module"}
                      isDisabled={fetchingModules}
                      styles={customSelectStyles}
                      isClearable
                      isSearchable
                    />
                    {errors.module && (
                      <p className="text-red-500 text-xs mt-1">{errors.module}</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24 shadow-xl shadow-slate-200/50">
                <Button
                  type="submit"
                  variant="filled"
                  color="primary"
                  className="w-full justify-center py-2 text-md font-bold rounded-lg shadow-lg shadow-blue-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    "Add Permission"
                  )}
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}