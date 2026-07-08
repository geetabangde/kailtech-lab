import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

// Input style tokens
const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100";
const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-dark-300";

export default function AddVendorItemPrice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  
  const [items, setItems] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/people/get-supplier/${id}`);
        if (res.data?.status === "true" || res.data?.status === true) {
          setVendor(res.data.data.supplier);
        } else {
          toast.error("Failed to load vendor details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading vendor");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCurrencies = async () => {
      try {
        const res = await axios.get("/master/currency-list");
        if (res.data?.status === "true" || res.data?.status === true) {
          setCurrencies(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch currencies:", err);
      }
    };
    
    if (id) {
      fetchVendor();
      fetchCurrencies();
    }
  }, [id]);
  
  const addItemRow = () => {
    setItems([...items, {
      material: "",
      specification: "",
      price: 0,
      currency: currencies.length > 0 ? currencies[0].id : "",
      discount: 0,
      remark: ""
    }]);
  };
  
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  
  const calculateTotal = (price, discount) => {
    const p = parseFloat(price) || 0;
    const d = parseFloat(discount) || 0;
    return (p - (p * d / 100)).toFixed(2);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("No Item is Added");
      return;
    }
    
    // Check if material name is filled for all items
    const invalidItems = items.filter(i => !i.material.trim());
    if (invalidItems.length > 0) {
      toast.error("Please enter material names for all items");
      return;
    }
    
    try {
      const payload = {
        vendor_id: id,
        material: items.map(i => i.material),
        specification: items.map(i => i.specification),
        discount: items.map(i => i.discount.toString()),
        subprice: items.map(i => i.price.toString()),
        price: items.map(i => calculateTotal(i.price, i.discount).toString()),
        remark: items.map(i => i.remark),
        currency: items.map(i => i.currency)
      };
      
      // Submit correctly formatted payload
      const res = await axios.post("/people/add-vendor-item-price", payload);
      
      if (res.data?.status === "true" || res.data?.status === true) {
        toast.success(res.data.message || "Vendor items saved successfully");
        navigate(`/dashboards/people/suppliers/edit/${id}`);
      } else {
        toast.error(res.data?.message || "Failed to save vendor items");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error saving vendor items");
    }
  };
  
  if (loading) {
    return (
      <Page title="Add Vendor Item Price">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </Page>
    );
  }
  
  return (
    <Page title="Add Vendor Item Price">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Add Vendor Item Price
          </h2>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate(`/dashboards/people/suppliers/edit/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Edit Supplier
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card className="mb-6 p-6">
            <h5 className="mb-4 text-lg font-semibold border-b pb-2">Vendor Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelCls}>Vendor Name</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={vendor?.name || ""}
                  className={inputCls + " bg-gray-50 text-gray-500 cursor-not-allowed"}
                />
              </div>
              <div>
                <label className={labelCls}>GST No.</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={vendor?.gstno || ""}
                  className={inputCls + " bg-gray-50 text-gray-500 cursor-not-allowed"}
                />
              </div>
              <div>
                <label className={labelCls}>Contact No.</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={vendor?.mobile || ""}
                  className={inputCls + " bg-gray-50 text-gray-500 cursor-not-allowed"}
                />
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h5 className="text-lg font-semibold">Product Details</h5>
              <Button type="button" onClick={addItemRow} color="primary" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table className="w-full text-left">
                <THead>
                  <Tr>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700 w-12 text-center">S.no</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Material / Services Name</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Specification</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700 w-28">Price</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700 w-48">Currency</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700 w-24">Discount%</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700 w-28">Total</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700">Remark</Th>
                    <Th className="bg-gray-100 p-3 font-semibold text-gray-700 w-16 text-center">Close</Th>
                  </Tr>
                </THead>
                <TBody>
                  {items.length === 0 ? (
                    <Tr>
                      <Td colSpan="9" className="p-8 text-center text-gray-500">
                        No items added. Click &quot;Add Item&quot; to start.
                      </Td>
                    </Tr>
                  ) : (
                    items.map((item, index) => (
                      <Tr key={index}>
                        <Td className="p-2 text-center align-middle font-medium">{index + 1}</Td>
                        <Td className="p-2">
                          <input
                            type="text"
                            value={item.material}
                            onChange={(e) => handleItemChange(index, "material", e.target.value)}
                            className={inputCls}
                            placeholder="Material name"
                            required
                          />
                        </Td>
                        <Td className="p-2">
                          <input
                            type="text"
                            value={item.specification}
                            onChange={(e) => handleItemChange(index, "specification", e.target.value)}
                            className={inputCls}
                            placeholder="Specification"
                          />
                        </Td>
                        <Td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, "price", e.target.value)}
                            className={inputCls}
                          />
                        </Td>
                        <Td className="p-2">
                          <select
                            value={item.currency}
                            onChange={(e) => handleItemChange(index, "currency", e.target.value)}
                            className={inputCls}
                          >
                            {currencies.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.description ? `(${c.description})` : ""}
                              </option>
                            ))}
                          </select>
                        </Td>
                        <Td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                            className={inputCls}
                          />
                        </Td>
                        <Td className="p-2">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={calculateTotal(item.price, item.discount)}
                            className={inputCls + " bg-gray-50 font-semibold cursor-not-allowed"}
                          />
                        </Td>
                        <Td className="p-2">
                          <input
                            type="text"
                            value={item.remark}
                            onChange={(e) => handleItemChange(index, "remark", e.target.value)}
                            className={inputCls}
                            placeholder="Remark"
                          />
                        </Td>
                        <Td className="p-2 text-center align-middle">
                          <Button
                            type="button"
                            variant="soft"
                            color="error"
                            size="sm"
                            className="p-2 rounded-full"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button type="submit" color="success" className="px-8 py-2 text-lg font-semibold bg-green-500 hover:bg-green-600">
                Submit Item Prices
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </Page>
  );
}
