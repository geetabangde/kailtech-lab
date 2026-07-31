// CustomerAddresses.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";

export default function CustomerAddresses() {
  const { id } = useParams(); // customer ID
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Fetch customer name + addresses ──────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [custRes, addrRes] = await Promise.allSettled([
          axios.get(`/people/get-single-customer/${id}`),
          axios.get(`/people/get-customers-address/${id}`),
        ]);

        if (custRes.status === "fulfilled") {
          setCustomerName(custRes.value?.data?.data?.name || "Customer");
        }

        if (addrRes.status === "fulfilled") {
          const d = addrRes.value?.data;
          const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
          setAddresses(list);
        }
      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ── Delete address ────────────────────────────────────────────────────
  const handleDelete = (addressId) => {
    toast("Are you sure you want to delete this address?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await axios.post(`/remove-customer-address/${addressId}`);
            setAddresses((prev) => prev.filter((a) => a.id !== addressId));
            toast.success("Address deleted");
          } catch {
            toast.error("Failed to delete address");
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
      actionButtonStyle: { backgroundColor: "#ef4444", color: "#fff", fontWeight: "bold" },
    });
  };

  return (
    <Page title={`${customerName} — Addresses`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {customerName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Customer Addresses
            </p>
          </div>
          <div className="flex gap-2">
            <Button color="primary" onClick={() => setShowAddModal(true)}>
              + Add New Address
            </Button>
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/dashboards/people/customers")}
            >
              ← Back to List
            </Button>
          </div>
        </div>

        {/* Address Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
            </svg>
            <span className="ml-3 text-gray-500">Loading addresses...</span>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No addresses found</p>
            <p className="text-sm mt-1">Click &quot;+ Add New Address&quot; to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {addresses.map((addr, idx) => (
              <div
                key={addr.id}
                className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white dark:bg-dark-800 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    #{idx + 1}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">
                  {addr.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{addr.mobile}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {addr.address}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {addr.city}{addr.pincode ? ` — ${addr.pincode}` : ""}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setEditingAddress(addr); setShowEditModal(true); }}
                    className="flex-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="flex-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <AddAddressModal
          customerId={id}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newAddr) => {
            setAddresses((prev) => [...prev, newAddr]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Address Modal */}
      {showEditModal && editingAddress && (
        <EditAddressModal
          initialData={editingAddress}
          onClose={() => { setShowEditModal(false); setEditingAddress(null); }}
          onSuccess={(updated) => {
            setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setShowEditModal(false);
            setEditingAddress(null);
          }}
        />
      )}
    </Page>
  );
}

// ── Add Address Modal ────────────────────────────────────────────────────
function AddAddressModal({ customerId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: "", mobile: "", address: "", city: "", pincode: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/people/add-customer-address", { ...formData, customer: customerId });
      if (res.data.status === true || res.data.status === "true") {
        toast.success(res.data.message || "Address added successfully");
        onSuccess({ ...formData, id: res.data.id || Date.now() });
      } else {
        toast.error(res.data.message || "Failed to add address");
      }
    } catch {
      toast.error("Error adding address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Add New Address" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Address Nickname" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required />
        <Input label="Mobile" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            rows={3}
            required
          />
        </div>
        <Input label="City" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} required />
        <Input label="Pincode" value={formData.pincode} onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))} maxLength={6} required />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
          <Button type="submit" color="primary" disabled={loading}>{loading ? "Saving..." : "Add Address"}</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ── Edit Address Modal ───────────────────────────────────────────────────
function EditAddressModal({ initialData, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    mobile: initialData?.mobile || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    pincode: initialData?.pincode || "",
  });
  const [loading, setLoading] = useState(false);
  const addressId = initialData?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`/people/update-customer-address/${addressId}`, formData);
      if (res.data.status === true || res.data.status === "true") {
        toast.success(res.data.message || "Address updated successfully");
        onSuccess({ ...formData, id: addressId });
      } else {
        toast.error(res.data.message || "Failed to update address");
      }
    } catch {
      toast.error("Error updating address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Edit Address" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Address Nickname" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required />
        <Input label="Mobile" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            rows={3}
            required
          />
        </div>
        <Input label="City" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} required />
        <Input label="Pincode" value={formData.pincode} onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))} maxLength={6} required />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
          <Button type="submit" color="primary" disabled={loading}>{loading ? "Saving..." : "Update Address"}</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ── Shared Modal Wrapper ─────────────────────────────────────────────────
function ModalWrapper({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
