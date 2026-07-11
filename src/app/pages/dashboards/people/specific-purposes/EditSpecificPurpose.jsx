import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Page } from "components/shared/Page";
import { Button, Input, Select, Textarea } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EditSpecificPurpose() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    ctype: "",
    parta: "",
    partb: "",
    remnant: "",
    description: "",
  });

  

  // ✅ Fetch dropdowns + existing specific purpose
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [choicesRes, customerRes, dataRes] = await Promise.all([
          axios.get("/get-choices"),
          axios.get("/people/get-customer-type-list"),
          axios.get(`/people/get-specific-purpose-byid/${id}`),
        ]);

        // Dropdowns
        setChoices(
          (choicesRes.data?.data || []).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );

        setCustomerTypes(
          (customerRes.data?.Data || []).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );

        // Existing form data
        const result = dataRes.data;
        if (result.status === "true" && result.data) {
          const item = result.data;
          setFormData({
            name: item.name || "",
            ctype: item.ctype?.toString() || "",
            parta: item.parta?.toString() || "",
            partb: item.partb?.toString() || "",
            remnant: item.remnant?.toString() || "",
            description: item.description || "",
          });
        } else {
          toast.error("Specific purpose data not found.");
        }

      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

    const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  // ✅ Submit updated form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("ctype", formData.ctype);
      form.append("parta", formData.parta);
      form.append("partb", formData.partb);
      form.append("remnant", formData.remnant);
      form.append("description", formData.description);

      const res = await axios.post(`/people/update-specific-purpose/${id}`, form);

      if (res.data.status === true || res.data.status === "true") {
        toast.success(res.data?.message || "Specific purpose updated ✅");
        navigate("/dashboards/people/specific-purposes");
      } else {
        toast.error(res.data?.message || "Failed to update ❌");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Edit Specific Purpose">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Specific Purpose</h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/people/specific-purposes")}
          >
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            label="Specific Purpose Name"
            placeholder="Enter purpose name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Select
            name="ctype"
            label="Customer Type"
            data={customerTypes}
            value={formData.ctype}
            onChange={handleChange}
            required
          />

          <Select
            name="parta"
            label="Is Part A Required?"
            data={choices}
            value={formData.parta}
            onChange={handleChange}
            required
          />

          <Select
            name="partb"
            label="Is Part B Required?"
            data={choices}
            value={formData.partb}
            onChange={handleChange}
            required
          />

          <Input
            name="remnant"
            label="Remnant Period (In Days)"
            placeholder="e.g. 21"
            type="number"
            value={formData.remnant}
            onChange={handleChange}
            required
          />

          <Textarea
            name="description"
            label="Specific Purpose Description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <Button type="submit" color="primary" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </form>
      </div>
    </Page>
  );
}
