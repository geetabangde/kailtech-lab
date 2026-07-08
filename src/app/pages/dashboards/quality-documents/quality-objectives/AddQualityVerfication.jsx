// Import Dependencies
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button, Input, Card, Radio } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";

// ----------------------------------------------------------------------

const INITIAL_ROWS = [
  { verification: "Impartiality", remarks: "", meetpolicy: "", meetobjective: "" },
  { verification: "Timely testing / calibration", remarks: "", meetpolicy: "", meetobjective: "" },
  { verification: "Personnel training", remarks: "", meetpolicy: "", meetobjective: "" },
  { verification: "Customer feedback", remarks: "", meetpolicy: "", meetobjective: "" },
  { verification: "Customer Complaint and its handling", remarks: "", meetpolicy: "", meetobjective: "" },
];

export default function AddQualityVerfication() {
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
    overallRemark: "Yes",
  });

  const [rows, setRows] = useState(INITIAL_ROWS);

  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    
    const hasEmptyFields = rows.some(row => 
      !row.remarks.trim() || !row.meetpolicy.trim() || !row.meetobjective.trim()
    );
    
    if (hasEmptyFields) toast.error("Please fill all table fields ❌");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !hasEmptyFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        date: formData.date,
        overall_remark: formData.overallRemark,
        items: rows
      };

      await axios.post("/quality-documents/add-quality-objective", payload);
      toast.success("Quality Objectives Verification submitted successfully ✅");
      navigate("/dashboards/quality-documents/quality-objectives");
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(err?.response?.data?.message || "Failed to submit form ❌");
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.includes(474)) {
    return (
      <Page title="Add Quality Objectives – Access Denied">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 474 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add Quality Objectives Verification">
      <div className="px-[var(--margin-x)] py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="flat"
              className="size-9 p-0 rounded-full"
              onClick={() => navigate("/dashboards/quality-documents/quality-objectives")}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-50">
              Add Quality Objectives Verification
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Input
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                error={errors.date}
                required
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
                    <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 w-16">S.No.</th>
                    <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 w-1/4">Verification Points</th>
                    <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Remarks</th>
                    <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Meets Policy</th>
                    <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Meets Objectives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                  {rows.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="p-4 text-center font-bold text-gray-400">{index + 1}.</td>
                      <td className="p-4 font-semibold text-gray-700 dark:text-dark-100">{row.verification}</td>
                      <td className="p-2">
                        <Input
                          placeholder="Enter remarks"
                          value={row.remarks}
                          onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
                          className="bg-transparent border-none focus:ring-1 ring-primary-500/20"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Meets policy"
                          value={row.meetpolicy}
                          onChange={(e) => handleRowChange(index, "meetpolicy", e.target.value)}
                          className="bg-transparent border-none focus:ring-1 ring-primary-500/20"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Meets objectives"
                          value={row.meetobjective}
                          onChange={(e) => handleRowChange(index, "meetobjective", e.target.value)}
                          className="bg-transparent border-none focus:ring-1 ring-primary-500/20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
              <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-4 uppercase tracking-wider">
                Remarks - Quality Policy & Objectives are consistent:
              </label>
              <div className="flex items-center space-x-8">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <Radio
                    name="overallRemark"
                    value="Yes"
                    checked={formData.overallRemark === "Yes"}
                    onChange={(e) => setFormData(prev => ({ ...prev, overallRemark: e.target.value }))}
                  />
                  <span className="text-gray-700 dark:text-dark-100 group-hover:text-primary-500 font-medium">Yes</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <Radio
                    name="overallRemark"
                    value="No"
                    checked={formData.overallRemark === "No"}
                    onChange={(e) => setFormData(prev => ({ ...prev, overallRemark: e.target.value }))}
                  />
                  <span className="text-gray-700 dark:text-dark-100 group-hover:text-red-500 font-medium">No</span>
                </label>
              </div>
            </div>

            <div className="pt-10">
              <Button 
                type="submit" 
                color="primary" 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary-500/20"
                disabled={loading}
              >
                {loading ? "Submitting Verification..." : "Submit Quality Objectives Verification"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </Page>
  );
}
