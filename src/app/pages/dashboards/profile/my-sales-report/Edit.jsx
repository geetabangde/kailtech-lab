import { useParams, useNavigate, Navigate } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { Button, Input, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

// PHP $permissions check
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

export default function EditStock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [stock, setStock] = useState({
    product_name: "",
    id_no: "",
    batch_no: "",
    location: "",
    quantity: "",
    critical: false,
  });

  const fetchStockDetail = useCallback(async () => {
    try {
      setFetching(true);
      // Backend should provide an endpoint to get single stock item by ID
      const response = await axios.get(`/profile/get-department-stock-detail/${id}`);
      
      if (response.data.status && response.data.data) {
        const data = response.data.data;
        setStock({
          product_name: data.product_name || "",
          id_no: data.id_no || "",
          batch_no: data.batch_no || "",
          location: data.location || "",
          quantity: data.quantity || "",
          critical: !!data.critical,
        });
      } else {
        toast.error("Failed to load stock details.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      // Fallback for demo/missing API: if actual stock data is returned in list, 
      // we might want to pass it via state, but here we fetch fresh.
      toast.error("Error connecting to server.");
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (permissions.includes(348)) {
      fetchStockDetail();
    }
  }, [fetchStockDetail, permissions]);

  // Permission Guard (348 is required for Edit)
  if (!permissions.includes(348)) {
    return <Navigate to="/dashboards/profile/my-department-stock" replace />;
  }

  const handleChange = (field, value) => {
    setStock((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("quantity", stock.quantity);
      form.append("critical", stock.critical ? "1" : "0");
      form.append("location", stock.location);

      const response = await axios.post(`/profile/update-department-stock/${id}`, form);
      
      if (response.data.status === "true" || response.data.status === true) {
        toast.success("Stock updated successfully ✅");
        navigate("/dashboards/profile/my-department-stock");
      } else {
        toast.error(response.data.message || "Failed to update stock.");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An error occurred during update.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Page title="Edit Stock">
        <div className="flex h-60 items-center justify-center">
          <p className="text-gray-500 animate-pulse">Loading stock details...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Stock">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Edit Stock Item: <span className="text-primary-600">{stock.product_name}</span>
          </h2>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboards/profile/my-department-stock")}
          >
            Back to List
          </Button>
        </div>

        <Card className="max-w-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                value={stock.product_name}
                disabled
                className="bg-gray-50"
              />
              <Input
                label="ID No"
                value={stock.id_no}
                disabled
                className="bg-gray-50"
              />
              <Input
                label="Batch No"
                value={stock.batch_no}
                disabled
                className="bg-gray-50"
              />
              <Input
                label="Location"
                value={stock.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
              <Input
                label="Quantity"
                type="number"
                value={stock.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                required
              />
              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="critical"
                  checked={stock.critical}
                  onChange={(e) => handleChange("critical", e.target.checked)}
                  className="size-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="critical" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Critical Stock Level
                </label>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" color="primary" className="w-full md:w-auto px-8" disabled={loading}>
                {loading ? "Saving Changes..." : "Save Stock Details"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
