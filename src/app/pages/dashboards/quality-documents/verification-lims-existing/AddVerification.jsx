// Import Dependencies
import { useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { Button, Input, Card, Upload } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { PlusIcon, TrashIcon, CloudArrowUpIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";

// ----------------------------------------------------------------------

export default function AddVerification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const permissions = useMemo(() => {
    const raw = localStorage.getItem("userPermissions") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return raw.trim().replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number).filter((n) => !isNaN(n));
    }
  }, []);

  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    activity: "",
    document: null,
  });

  const [rows, setRows] = useState([
    { id: Date.now(), verification: "", remark: "" },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), verification: "", remark: "" },
    ]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((row) => row.id !== id));
    } else {
      toast.error("At least one verification point is required");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.activity.trim()) newErrors.activity = "Activity is required";

    const rowErrors = rows.some((row) => !row.verification.trim());
    if (rowErrors) toast.error("All verification points must be filled");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !rowErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("date", formData.date);
      data.append("activity", formData.activity);
      
      // Handle array data for PHP backend
      rows.forEach((row) => {
        data.append("verfication[]", row.verification);
        data.append("remark[]", row.remark);
      });

      if (formData.document) {
        data.append("document", formData.document);
      }

      await axios.post("/quality-documents/add-lims-existing", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Verification Form submitted successfully ✅");
      navigate("/dashboards/quality-documents/verification-lims");
    } catch (err) {
      console.error("Error creating verification:", err);
      toast.error(err?.response?.data?.message || "Failed to submit form ❌");
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.includes(472)) {
    return (
      <Page title="Add Document Verification Form">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 472 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add Document Verification Form">
      <div className="px-[var(--margin-x)] py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="flat"
              className="size-9 p-0 rounded-full"
              onClick={() => navigate("/dashboards/quality-documents/verification-lims")}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-50">
              Add Verification Form
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Input
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
              />

              <Input
                label="Activity"
                name="activity"
                placeholder="Ex: Document Verification"
                value={formData.activity}
                onChange={handleChange}
                error={errors.activity}
                required
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
                    <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 w-16">S.No.</th>
                    <th className="p-3 text-left text-xs font-bold uppercase text-gray-500">Verification Points</th>
                    <th className="p-3 text-left text-xs font-bold uppercase text-gray-500">Remarks</th>
                    <th className="p-3 text-center text-xs font-bold uppercase text-gray-500 w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                  {rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                      <td className="p-3 text-center font-medium text-gray-500">{index + 1}</td>
                      <td className="p-3">
                        <Input
                          placeholder="Verification point"
                          value={row.verification}
                          onChange={(e) => handleRowChange(row.id, "verification", e.target.value)}
                          unstyled
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="Enter remark"
                          value={row.remark}
                          onChange={(e) => handleRowChange(row.id, "remark", e.target.value)}
                          unstyled
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="flat"
                          color="danger"
                          className="size-8 p-0 rounded-full"
                          onClick={() => removeRow(row.id)}
                          type="button"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Button
                variant="flat"
                color="success"
                onClick={addRow}
                type="button"
                className="gap-2"
              >
                <PlusIcon className="size-4" />
                Add Row
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200">
                Attached Document
              </label>
              
              <Upload
                onChange={(file) => setFormData(prev => ({ ...prev, document: file }))}
                accept=".pdf,.doc,.docx,.jpg,.png"
              >
                {({ onClick }) => (
                  <div 
                    onClick={onClick}
                    className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-primary-500 hover:bg-primary-50/30 dark:border-dark-500 dark:bg-dark-800 dark:hover:border-primary-500"
                  >
                    <div className="mb-3 rounded-full bg-white p-3 shadow-sm transition-transform group-hover:scale-110 dark:bg-dark-700">
                      <CloudArrowUpIcon className="size-8 text-primary-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                        {formData.document ? formData.document.name : "Click to upload document"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, DOC, JPG or PNG (max. 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </Upload>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-dark-600 mt-8">
              <Button 
                type="submit" 
                color="primary" 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary-500/20"
                disabled={loading}
              >
                {loading ? "Submitting Request..." : "Submit Verification Form"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </Page>
  );
}
