import { useState, useEffect } from "react";
import axios from "utils/axios";
import Select from "react-select";

const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-300 mb-1 block text-sm font-medium text-gray-700";

export default function GetCustAddForProInv({
  customerId,
  form,
  setField,
}) {
  const [addresses, setAddresses] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Fetch addresses and contacts when customerId changes
  useEffect(() => {
    if (!customerId) {
      setAddresses([]);
      setContacts([]);
      return;
    }

    const loadData = async () => {
      try {
        const [addrRes, contactRes] = await Promise.all([
          axios.get(`/people/get-customers-address/${customerId}`),
          axios.get(`/get-concern-person/${customerId}`),
        ]);
        setAddresses(addrRes.data?.data ?? addrRes.data ?? []);
        setContacts(contactRes.data?.data ?? contactRes.data ?? []);
      } catch (err) {
        console.error("Failed to load customer data", err);
      }
    };

    loadData();
  }, [customerId]);

  const addressOptions = addresses.map((a) => ({
    value: a.id,
    label: `${a.name}(${a.address})`,
  }));

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <>
      <div className="form-group mb-4">
        <label className={labelCls}>Customer Address</label>
        <Select
          options={addressOptions}
          value={addressOptions.find((o) => o.value == form?.addressid) || null}
          onChange={(selected) =>
            setField("addressid", selected ? selected.value : "")
          }
          placeholder="Select Address"
          isClearable
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <input
          type="hidden"
          name="customername"
          value={form?.customername || ""}
        />
      </div>

      <div className="form-group mb-4">
        <label className={labelCls}>Contact Person Name</label>
        <Select
          options={contactOptions}
          value={contactOptions.find((o) => o.value == form?.cperson) || null}
          onChange={(selected) =>
            setField("cperson", selected ? selected.value : "")
          }
          placeholder="Customer Contact"
          isClearable
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      <div className="form-group mb-4">
        <label className={labelCls}>Gst Number</label>
        <input
          type="text"
          className={inputCls}
          value={form?.gstno || ""}
          onChange={(e) => setField("gstno", e.target.value)}
          name="gstno"
        />
        <input
          type="hidden"
          name="statecode"
          value={form?.statecode || ""}
        />
      </div>

      <div className="form-group mb-4">
        <label className={labelCls}>PAN Number</label>
        <input
          type="text"
          className={inputCls}
          value={form?.pan || ""}
          onChange={(e) => setField("pan", e.target.value)}
          name="pan"
        />
      </div>
    </>
  );
}
