import { useNavigate } from "react-router";
import { useState } from "react";
import { Button, Input, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function AddProcess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  const [steps, setSteps] = useState([
    { name: "", description: "" }
  ]);

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

  const handleStepChange = (index, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[index][field] = value;
    setSteps(updatedSteps);
  };

  const addStep = () => {
    setSteps([...steps, { name: "", description: "" }]);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Process Name is required";

    // Validate steps are not empty
    const incompleteStep = steps.some(step => !step.name.trim() || !step.description.trim());
    if (incompleteStep) {
      toast.error("Please fill in all Step Names and Descriptions");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        stepname: steps.map(s => s.name),
        stepdesc: steps.map(s => s.description),
      };

      const response = await axios.post("rolemanagment/create-process", payload);

      if (response.data.success || response.data.status === true) {
        toast.success(response.data.message || "New Process has been added successfully ✅");
        navigate("/dashboards/role-management/process-guide");
      } else {
        toast.error(response.data.message || "Failed to add process");
      }
    } catch (err) {
      console.error("Error creating process:", err);
      toast.error(err?.response?.data?.message || "Error adding process ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add New Process">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add New Process
          </h2>
          <Button
            variant="outlined"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/role-management/process-guide")}
          >
            Back to List
          </Button>
        </div>

        {/* Form Wrapper */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Process Name */}
            <div>
              <Input
                label="Process Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
            </div>

            {/* Dynamic Steps Section */}
            <div className="border-t border-b border-gray-100 dark:border-dark-800 py-4 my-4 space-y-3">

              {/* Step Labels */}
              <div className="grid grid-cols-12 gap-3 items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Step Name</div>
                <div className="col-span-7">Step Desc</div>
                <div className="col-span-1"></div>
              </div>

              {/* Step Rows */}
              {steps.map((step, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <Input
                      placeholder="Enter Step Name"
                      value={step.name}
                      onChange={(e) => handleStepChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-7">
                    <Input
                      placeholder="Enter Step Description"
                      value={step.description}
                      onChange={(e) => handleStepChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="outlined"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 !px-3"
                        onClick={() => removeStep(index)}
                      >
                        X
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="sm"
                  onClick={addStep}
                  className="text-blue-600 border-blue-500 hover:bg-blue-50"
                >
                  Add Button
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Category */}
            <div>
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end">
              <Button type="submit" color="primary" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                      ></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  "Add Process"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}