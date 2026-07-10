import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";

export default function EditBillingDetails() {
  const { id: inward_id } = useParams(); // dynamic inward id from route
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = location.search; // query params preserve

  const [customers, setCustomers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [initialBillingAddress, setInitialBillingAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch initial data (customers and inward entry details)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Customers
        const resCustomers = await axios.get("/people/get-all-customers");
        if (resCustomers.data.status === "true" && resCustomers.data.data) {
          setCustomers(resCustomers.data.data);
        } else {
          toast.error("Failed to load customers.");
        }

        // 2. Fetch Inward Entry Details to prefill
        if (inward_id) {
          const resInward = await axios.get(
            `/calibrationprocess/get-inward-entry_byid/${inward_id}`
          );
          if (
            (resInward.data.status === "true" || resInward.data.status === true) &&
            resInward.data.data
          ) {
            const entryData = resInward.data.data;
            // Prefer billingname if available, otherwise fallback to customerid
            const customerIdToSelect = entryData.billingname || entryData.customerid;
            if (customerIdToSelect) {
              setSelectedCustomer(String(customerIdToSelect));
            }
            // Capture the address if it's provided by the API
            const addressIdToSelect = entryData.billingaddress || entryData.reportaddress;
            if (addressIdToSelect && addressIdToSelect !== "nothing") {
              setInitialBillingAddress(String(addressIdToSelect));
            }
          }
        }
      } catch {
        toast.error("Error fetching initial data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [inward_id]);

  // Fetch addresses when customer changes
  useEffect(() => {
    if (!selectedCustomer) {
      setAddresses([]);
      setSelectedCustomerData(null);
      return;
    }

    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/people/get-customers-address/${selectedCustomer}`);
        if (res.data.status === "true" && res.data.data) {
          const loadedAddresses = res.data.data;
          setAddresses(loadedAddresses);
          
          // Auto-select address
          if (initialBillingAddress) {
            setSelectedAddress(initialBillingAddress);
            setInitialBillingAddress(""); // Clear so it doesn't override manual changes later
          } else if (loadedAddresses.length === 1) {
            // Fallback: auto-select if there's only one address available
            setSelectedAddress(String(loadedAddresses[0].id));
          }
        } else {
          toast.error("Failed to load customer addresses.");
        }
      } catch  {
        toast.error("Error fetching addresses.");
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();

    const customerData = customers.find(c => String(c.id) === selectedCustomer);
    setSelectedCustomerData(customerData || null);
  }, [selectedCustomer, customers, initialBillingAddress]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!selectedCustomer) newErrors.customer = "Please select a customer.";
    if (!selectedAddress) newErrors.address = "Please select an address.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        inward_id,
        billingname: selectedCustomer,
        billingaddress: selectedAddress,
        gstno: selectedCustomerData?.gstno || "",
      };

      const res = await axios.post("/calibrationprocess/edit-billing-details", payload);
      const result = res.data;

      if (result.status === "true") {
        toast.success("Billing details updated successfully ✅");
        setTimeout(() => {
          navigate(`/dashboards/calibration-process/inward-entry-lab${searchParams}`);
        }, 1000);
      } else {
        toast.error(result.message || "Failed to update billing details.");
      }
    } catch  {
      toast.error("Error submitting form.");
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers
    .filter((c) => c.id != null)
    .map((c) => ({
      value: String(c.id),
      label: `${c.name} (${c.pnumber || "N/A"})`,
    }));

  const addressOptions = addresses.map((a) => ({
    value: String(a.id),
    label: `${a.name} - ${a.address}`,
  }));

  return (
    <Page title="Edit Billing Details">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Edit Billing Details
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              navigate(`/dashboards/calibration-process/inward-entry-lab${searchParams}`)
            }
          >
            Back to Inward Entry List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <Select
              options={customerOptions}
              value={customerOptions.find((o) => o.value === selectedCustomer) || null}
              onChange={(option) => {
                setSelectedCustomer(option ? option.value : "");
                setSelectedAddress("");
                setErrors({});
              }}
              placeholder="Select Customer"
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {errors.customer && (
              <span className="text-red-500 text-sm">{errors.customer}</span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select Address
            </label>
            <Select
              options={addressOptions}
              value={addressOptions.find((o) => o.value === selectedAddress) || null}
              onChange={(option) => {
                setSelectedAddress(option ? option.value : "");
                setErrors({});
              }}
              placeholder="Select Address"
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {errors.address && (
              <span className="text-red-500 text-sm">{errors.address}</span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Customer GST Number
            </label>
            <Input
              value={selectedCustomerData?.gstno || "No GST Available"}
              readOnly
              style={{
                backgroundColor: selectedCustomer ? "#f0f0f0" : "#dcdcdc",
              }}
            />
          </div>

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
              "Update Billing Details"
            )}
          </Button>
        </form>
      </div>
    </Page>
  );
}
