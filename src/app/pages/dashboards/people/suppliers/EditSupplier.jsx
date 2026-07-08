import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Input, Select } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { Table, THead, TBody, Th, Tr, Td } from "components/ui";

export default function EditSupplier() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    company: "",
    email: "",
    mobile: "",
    gstno: "",
    panno: "",
    city: "",
    website: "",
    country: "",
    state: "",
    scontact: "",
    sphone: "",
    semail: "",
    designation: ""
  });
  
  const [materials, setMaterials] = useState([]);
  const [currencies, setCurrencies] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch supplier data
        const res = await axios.get(`/people/get-supplier/${id}`);
        if (res.data?.status === "true" || res.data?.status === true) {
          const sup = res.data.data.supplier || {};
          setFormData({
            name: sup.name || "",
            address: sup.address || "",
            company: sup.company || "",
            email: sup.email || "",
            mobile: sup.mobile || "",
            gstno: sup.gstno || "",
            panno: sup.panno || "",
            city: sup.city || "",
            website: sup.website || "",
            country: sup.country || "",
            state: sup.state || "",
            scontact: sup.scontact || "",
            sphone: sup.sphone || "",
            semail: sup.semail || "",
            designation: sup.designation || ""
          });
          setMaterials(res.data.data.materials || []);
        } else {
          toast.error("Failed to fetch supplier details");
        }
        
        // Fetch currencies for mapping
        try {
          const currRes = await axios.get("/master/currency-list");
          if (currRes.data?.status === "true" || currRes.data?.status === true) {
            const currMap = {};
            currRes.data.data.forEach(c => {
              currMap[c.id] = `${c.name} ${c.description ? `(${c.description})` : ""}`;
            });
            setCurrencies(currMap);
          }
        } catch (err) {
          console.error("Error fetching currencies mapping", err);
        }
        
      } catch (err) {
        console.error(err);
        toast.error("Error fetching supplier data");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Make standard update api call (assumed endpoint based on convention)
      await axios.post(`/people/update-supplier/${id}`, formData);
      toast.success("Supplier updated successfully");
      navigate("/dashboards/people/suppliers");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Error updating supplier");
    }
  };

  if (loading) {
    return (
      <Page title="Edit Supplier">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Supplier">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Supplier</h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/people/suppliers")}
          >
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <form onSubmit={handleSubmit} id="editSupplierForm" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Supplier Name" name="name" value={formData.name} onChange={handleChange} placeholder="Supplier name" required />
              
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Company Address"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring focus:border-primary-500"
                    rows="3"
                    required
                  ></textarea>
                </div>
              
                <Input label="Company" name="company" value={formData.company} onChange={handleChange} placeholder="Company" />
                <Input label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" />
                <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile" type="tel" />
                <Input label="GST No" name="gstno" value={formData.gstno} onChange={handleChange} placeholder="GST No" />
                <Input label="PAN No" name="panno" value={formData.panno} onChange={handleChange} placeholder="PAN No" />
                <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                <Input label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="Website" />
              
                <Select label="Country*" name="country" value={formData.country} onChange={handleChange} required>
                  <option value="">Choose one..</option>
                  <option value="1">India</option>
                </Select>
              
                <Input label="State*" name="state" value={formData.state} onChange={handleChange} placeholder="State" required />
              
                {/* Contact Person Section */}
                <div className="md:col-span-2 mt-4">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">Contact person</h5>
                </div>
                
                <Input label="Name*" name="scontact" value={formData.scontact} onChange={handleChange} placeholder="Primary Name" required />
                <Input label="Phone*" name="sphone" value={formData.sphone} onChange={handleChange} placeholder="Primary Phone Number" required type="tel" />
                <Input label="E-mail" name="semail" value={formData.semail} onChange={handleChange} placeholder="Primary Email" type="email" />
                <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" />
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
               <Button type="submit" form="editSupplierForm" color="success" className="w-full py-3 text-lg font-semibold bg-green-500 hover:bg-green-600">
                 Update Supplier
               </Button>
            </div>
          </div>
        </div>

        {/* Purchased Materials Tabs section */}
        <div className="mt-8 rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Purchased Materials</h3>
            <Button color="primary" onClick={() => navigate(`/dashboards/people/suppliers/add-vendor-item-price/${id}`)}>
              Add Item List
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table hoverable className="w-full text-left">
              <THead>
                <Tr>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Type</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Name</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Specification</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Subprice</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Discount</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Price</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Currency</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Remark</Th>
                  <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Action</Th>
                </Tr>
              </THead>
              <TBody>
                {materials.length > 0 ? (
                  materials.map((mat, index) => (
                    <Tr key={index} className="border-b">
                      <Td className="p-3">{mat.type || mat.category || "-"}</Td>
                      <Td className="p-3">{mat.material || mat.name || "-"}</Td>
                      <Td className="p-3">{mat.specification || "-"}</Td>
                      <Td className="p-3">{mat.subprice || "-"}</Td>
                      <Td className="p-3">{mat.discount || "-"}</Td>
                      <Td className="p-3">{mat.price || "-"}</Td>
                      <Td className="p-3">{currencies[mat.currency] || mat.currency_name || mat.currency || "-"}</Td>
                      <Td className="p-3">{mat.remark || "-"}</Td>
                      <Td className="p-3">
                         <div className="flex gap-2">
                           <Button size="sm" color="error" variant="soft">Delete</Button>
                           <Button size="sm" color="info" variant="soft">Edit</Button>
                         </div>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan="9" className="p-4 text-center text-gray-500">
                      No materials found for this supplier.
                    </Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </div>
        </div>
      </div>
    </Page>
  );
}
