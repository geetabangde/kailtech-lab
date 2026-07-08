import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";

// ----------------------------------------------------------------------

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";

function FormRow({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="dark:text-dark-300 text-sm font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AddSpecificPrice() {
  const navigate = useNavigate();

  // Dropdown data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    customer: "",
    product: "",
    package: "",
    price: "",
    currency: "",
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Load initial dropdowns
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, pRes, curRes] = await Promise.all([
          axios.get("/people/get-all-customers"),
          axios.get("/testing/get-prodcut-list"),
          axios.get("/master/currency-list"),
        ]);

        if (cRes.data.status && Array.isArray(cRes.data.data)) setCustomers(cRes.data.data);
        if (pRes.data.status && Array.isArray(pRes.data.data)) setProducts(pRes.data.data);
        if (curRes.data.status && Array.isArray(curRes.data.data)) {
          setCurrencies(curRes.data.data);
          // Default to INR if available (usually id 1)
          const inr = curRes.data.data.find(c => c.name === "INR");
          if (inr) set("currency", inr.id);
        }
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
        toast.error("Failed to load necessary data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load packages when product changes
  useEffect(() => {
    if (!form.product) {
      setPackages([]);
      set("package", "");
      return;
    }

    const loadPackages = async () => {
      try {
        const res = await axios.get(`/testing/get-package-list?pid=${form.product}&type=2`);
        if (res.data.status && Array.isArray(res.data.data)) {
          setPackages(res.data.data);
        } else {
          setPackages([]);
        }
      } catch (err) {
        console.error("Failed to load packages:", err);
      }
    };
    loadPackages();
  }, [form.product]);

  const handleSubmit = async () => {
    // Validation
    if (!form.customer) return toast.error("Please select a customer");
    if (!form.product) return toast.error("Please select a product");
    if (!form.package) return toast.error("Please select a test package");
    if (!form.price) return toast.error("Please enter a rate");
    if (!form.currency) return toast.error("Please select a currency");

    setSubmitting(true);
    try {
      // Get employee ID from localStorage
      const employeeId = localStorage.getItem('employee') || localStorage.getItem('userId');
      
      const payload = {
        product: Number(form.product),
        package: Number(form.package),
        customer: Number(form.customer),
        price: Number(form.price),
        currency: Number(form.currency),
        employee_id: Number(employeeId)
      };

      const res = await axios.post("/sales/add-special-price", payload);
      if (res.data.status === true || res.data.status === "true") {
        toast.success(res.data.message ?? "Special price added ✅");
        navigate("/dashboards/sales/specific-price-list");
      } else {
        toast.error(res.data.message ?? "Failed to add special price");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while saving");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Add Specific Price">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-gray-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p>Loading dropdown data...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add New Specific Price">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Add New Specific Price
            </h2>
          </div>
          <Link to="/dashboards/sales/specific-price-list">
            <Button variant="outline" className="text-gray-600">
              &lt;&lt; Back to Specific Prices
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Customer */}
            <div className="md:col-span-2">
              <FormRow label="Customer Name" required>
                <Select
                  options={customers.map((c) => ({ value: c.id, label: c.name }))}
                  value={customers.map((c) => ({ value: c.id, label: c.name })).find((o) => o.value === form.customer)}
                  onChange={(opt) => set("customer", opt ? opt.value : "")}
                  placeholder="Search and select customer..."
                  isSearchable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </FormRow>
            </div>

            {/* Product */}
            <FormRow label="Product Name" required>
              <Select
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                value={products.map((p) => ({ value: p.id, label: p.name })).find((o) => o.value === form.product)}
                onChange={(opt) => set("product", opt ? opt.value : "")}
                placeholder="Select product..."
                isSearchable
                classNamePrefix="react-select"
              />
            </FormRow>

            {/* Package */}
            <FormRow label="Test Package Name" required>
              <Select
                options={packages.map((pkg) => ({ value: pkg.id, label: pkg.package }))}
                value={packages.map((pkg) => ({ value: pkg.id, label: pkg.package })).find((o) => o.value === form.package)}
                onChange={(opt) => set("package", opt ? opt.value : "")}
                placeholder={form.product ? "Select package..." : "Select product first"}
                isDisabled={!form.product}
                isSearchable
                classNamePrefix="react-select"
              />
            </FormRow>

            {/* Rate */}
            <FormRow label="Rate" required>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="Enter special rate"
                className={inputCls}
              />
            </FormRow>

            {/* Currency */}
            <FormRow label="Currency" required>
              <Select
                options={currencies.map((c) => ({ value: c.id, label: `${c.name} (${c.description})` }))}
                value={currencies.map((c) => ({ value: c.id, label: `${c.name} (${c.description})` })).find((o) => o.value === form.currency)}
                onChange={(opt) => set("currency", opt ? opt.value : "")}
                placeholder="Select currency..."
                isSearchable
                classNamePrefix="react-select"
              />
            </FormRow>

          </div>

          <div className="mt-10 flex justify-end gap-3 border-t pt-6">
            <Button
              onClick={() => navigate("/dashboards/sales/specific-price-list")}
              variant="outline"
              className="px-8"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-10"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </span>
              ) : "Add Special Price"}
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
