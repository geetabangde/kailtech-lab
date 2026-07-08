import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import ReactSelect from "react-select";

export default function EditGateEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [gateEntry, setGateEntry] = useState({
    purpose: "",
    description: "",
    quantity: "",
    source: "",
  });
  const [purposes, setPurposes] = useState([]);
  const [fetchingPurposes, setFetchingPurposes] = useState(true);

  useEffect(() => {
    const fetchPurposes = async () => {
      try {
        setFetchingPurposes(true);
        const response = await axios.get("/people/get-specific-purpose-list");
        if (response.data.status && Array.isArray(response.data.data)) {
          setPurposes(
            response.data.data.map((p) => ({ value: p.id, label: p.name }))
          );
        }
      } catch (err) {
        console.error("Error fetching gate purposes:", err);
      } finally {
        setFetchingPurposes(false);
      }
    };

    const fetchGateEntry = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/gateentry/get-gate-entry-byid/${id}`);
        const result = response.data;

        if (result.status === "true" || result.status === true) {
          setGateEntry({
            purpose: result.data.purpose || "",
            description: result.data.description || "",
            quantity: result.data.quantity || "",
            source: result.data.source || "",
          });
        } else {
          toast.error(result.message || "Failed to load gate entry data.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurposes();
    fetchGateEntry();
  }, [id]);

  // Handle input changes with error clearing
  const handleInputChange = (field, value) => {
    setGateEntry({ ...gateEntry, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Custom validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!gateEntry.purpose) {
      newErrors.purpose = "This is required field";
    }
    
    if (!gateEntry.description) {
      newErrors.description = "This is required field";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Update gate entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const form = new FormData();
      form.append("purpose", gateEntry.purpose);
      form.append("description", gateEntry.description);
      form.append("quantity", gateEntry.quantity);
      form.append("source", gateEntry.source);

      const response = await axios.post(`/gateentry/gate-entry-update/${id}`, form);
      const result = response.data;

      if (result.status === "true" || result.status === true) {
        toast.success(result.message || "Gate entry updated successfully ✅", {
          duration: 1000,
          icon: "✅",
        });

        navigate("/dashboards/gate-entry/gate-entry");
      } else {
        toast.error(result.message || "Failed to update gate entry ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Edit Gate Entry">
      <div className="p-6">
        {/* ✅ Header + Back Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Edit Gate Entry
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/gate-entry/gate-entry")}
          >
            Back to Gate Entries
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium">Purpose</label>
            <ReactSelect
              options={purposes}
              value={purposes.find((p) => p.value == gateEntry.purpose) || null}
              onChange={(selected) => {
                setGateEntry((prev) => ({ ...prev, purpose: selected ? selected.value : "" }));
                if (errors.purpose) {
                  setErrors((prev) => ({ ...prev, purpose: "" }));
                }
              }}
              placeholder={fetchingPurposes ? "Loading..." : "Select Purpose"}
              isClearable
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "42px",
                  borderRadius: "0.5rem",
                  borderColor: "#D1D5DB",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#9CA3AF" },
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-500">{errors.purpose}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Describe Items</label>
              <textarea
                name="description"
                placeholder="Describe Items"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-900"
                rows={3}
                value={gateEntry.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Source"
              value={gateEntry.source}
              onChange={(e) => handleInputChange("source", e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Quantity"
              value={gateEntry.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <Button type="submit" color="primary" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
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
                  Updating...
                </div>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
