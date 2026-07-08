import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

// ----------------------------------------------------------------------

export default function EditTQuotationItem() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [standards, setStandards] = useState([]);
    const [products, setProducts] = useState([]);
    const [quoteData, setQuoteData] = useState(null);

    const [existingItems, setExistingItems] = useState([]);
    const [newItems, setNewItems] = useState([]);

    const [taxData, setTaxData] = useState({
        discnumber: 0,
        disctype: 1,
        mobilisation: 0,
        witness: 0,
        sampleprep: 0,
        gstnumber: 18,
        gsttype: 2,
        freight: 0,
        revised_from: 0
    });

    const [newRowPackages, setNewRowPackages] = useState({});
    const [newRowGrades, setNewRowGrades] = useState({});
    const [newRowSizes, setNewRowSizes] = useState({});
    const [newRowSamples, setNewRowSamples] = useState({});

    const fetchDependentData = useCallback(async (index, pid, verticalType = null) => {
        try {
            const vType = verticalType || quoteData?.vertical || 2;
            const [pkgRes, gsRes] = await Promise.all([
                axios.get(`/testing/get-package-list?pid=${pid}&type=${vType}`),
                axios.get(`/testing/get-grade-and-size?pid=${pid}`)
            ]);
            setNewRowPackages(prev => ({ ...prev, [index]: pkgRes.data?.data || [] }));
            setNewRowGrades(prev => ({ ...prev, [index]: gsRes.data?.grades || [] }));
            setNewRowSizes(prev => ({ ...prev, [index]: gsRes.data?.sizes || [] }));
        } catch {
            console.warn(`Failed to fetch dependents for row ${index}`);
        }
    }, [quoteData?.vertical]);

    const fetchSampleReq = useCallback(async (index, pkgId) => {
        try {
            const res = await axios.get(`/testing/get-package-quantity?pkg=${pkgId}`);
            if (res.data?.status && res.data.data) {
                const reqs = res.data.data.map(q => `${q.name} ${q.quantity} ${q.unit_name}`).join(", ");
                setNewRowSamples(prev => ({ ...prev, [index]: reqs }));
            }
        } catch {
            console.warn(`Failed to fetch samples for row ${index}`);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [quoteRes, stdRes, prodRes] = await Promise.all([
                axios.get(`/sales/get-quotation-item/${id}`),
                axios.get("/testing/get-standards"),
                axios.get("/testing/get-prodcut-list")
            ]);

            if (quoteRes.data?.status) {
                const q = quoteRes.data.quotation?.[0];
                setQuoteData(q || null);
                setTaxData({
                    discnumber: q?.discnumber || 0,
                    disctype: q?.disctype || 1,
                    mobilisation: q?.mobilisation || 0,
                    witness: q?.witness || 0,
                    sampleprep: q?.sampleprep || 0,
                    gstnumber: q?.gstnumber || 18,
                    gsttype: q?.gsttype || 2,
                    freight: q?.freight || 0,
                    revised_from: q?.revised_from || 0
                });
                setExistingItems(quoteRes.data.items || []);
            }
            if (stdRes.data?.data) setStandards(stdRes.data.data);
            if (prodRes.data?.data) setProducts(prodRes.data.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addNewRow = () => {
        setNewItems(prev => [
            ...prev,
            { standard: "", product: "", grade: "", size: "", package: "", qty: 1, unitcost: 0, total: 0, tempId: Date.now() }
        ]);
    };

    const deleteExistingItem = async (itemId) => {
        if (!window.confirm("Delete this item?")) return;
        try {
            const res = await axios.delete(`/sales/delete-quotation-product/${itemId}`);
            if (res.data.status) {
                setExistingItems(prev => prev.filter(item => item.id !== itemId));
                toast.success("Item deleted successfully");
            } else {
                toast.error(res.data.message || "Delete failed");
            }
        } catch {
            toast.error("Delete failed");
        }
    };

    const cloneExistingItem = async (item) => {
        try {
            const res = await axios.get(`/sales/clone-product-item/${item.id}`);
            if (res.data.status) {
                const clonedData = res.data.data;
                const index = newItems.length;

                setNewItems(prev => [
                    ...prev,
                    {
                        standard: clonedData.standard,
                        standard_name: clonedData.standard_name,
                        product: clonedData.product,
                        product_name: clonedData.product_name,
                        grade: clonedData.grade,
                        grade_name: clonedData.grade_name || "None",
                        size: clonedData.size,
                        size_name: clonedData.size_name || "None",
                        package: clonedData.package,
                        package_name: clonedData.package_name,
                        qty: Number(clonedData.qty) || 1,
                        unitcost: clonedData.unitcost,
                        total: clonedData.total,
                        parameters: clonedData.parameters || [], // Preserve parameters from clone
                        tempId: Date.now()
                    }
                ]);

                // Fetch dependent data for the new row to populate dropdowns
                fetchDependentData(index, clonedData.product);

                // Also fetch sample requirements for the new row
                if (clonedData.package) {
                    fetchSampleReq(index, clonedData.package);
                }

                toast.success("Item cloned successfully");
            } else {
                toast.error(res.data.status === false ? res.data.message : "Failed to clone item");
            }
        } catch (error) {
            console.error("Clone error:", error);
            toast.error("An error occurred while cloning the item");
        }
    };

    const handleNewItemChange = (index, field, value) => {
        setNewItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            if (field === "qty" || field === "unitcost") {
                updated[index].total = Number(updated[index].qty || 0) * Number(updated[index].unitcost || 0);
            }
            return updated;
        });
        if (field === "product" && value) fetchDependentData(index, value);
        if (field === "package" && value) {
            const pkg = (newRowPackages[index] || []).find(p => String(p.id) === String(value));
            if (pkg?.rate) handleNewItemChange(index, "unitcost", pkg.rate);
            fetchSampleReq(index, value);
        }
    };

    const handleTaxChange = (e) => {
        const { name, value } = e.target;
        setTaxData(prev => ({ ...prev, [name]: value }));
    };

    const totals = useMemo(() => {
        const subtotal = [...existingItems, ...newItems].reduce((sum, item) => sum + Number(item.total || 0), 0);
        const { discnumber, disctype, mobilisation, witness, sampleprep, gstnumber, gsttype, freight } = taxData;

        let discount = Number(discnumber) !== 0 ? (Number(disctype) === 2 ? (subtotal * Number(discnumber)) / 100 : Number(discnumber)) : 0;
        const afterDiscount = subtotal - discount;
        const totalBeforeGst = afterDiscount + Number(mobilisation) + Number(sampleprep) + Number(witness) + Number(freight);
        let gstAmount = Number(gstnumber) !== 0 ? (Number(gsttype) === 2 ? (totalBeforeGst * Number(gstnumber)) / 100 : Number(gstnumber)) : 0;

        return { subtotal, discount, afterDiscount, gstAmount, total: totalBeforeGst + gstAmount };
    }, [existingItems, newItems, taxData]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = { 
                id: Number(id), 
                subtotal: totals.subtotal, 
                discnumber: Number(taxData.discnumber), 
                disctype: Number(taxData.disctype), 
                discount: totals.discount, 
                mobilisation: Number(taxData.mobilisation), 
                witness: Number(taxData.witness), 
                sampleprep: Number(taxData.sampleprep), 
                gstnumber: Number(taxData.gstnumber), 
                gsttype: Number(taxData.gsttype), 
                gst: totals.gstAmount, 
                freight: Number(taxData.freight), 
                total: totals.total, 
                revised_from: taxData.revised_from || null 
            };
            
            const res = await axios.post("/sales/update-quotation", payload);
            if (res.data.status) {
                toast.success(res.data.message || "Quotation Updated Successfully");
                navigate(-1);
            } else {
                toast.error(res.data.message || "Update failed");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Error updating quotation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <Page title="Edit Quotation Item">
            <div className="transition-content px-[var(--margin-x)] pb-12 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold text-slate-800">Edit Quotation Item</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
                            <ArrowLeft size={14} /> Back
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting} size="sm" className="!bg-blue-600 !text-white hover:!bg-blue-700 border-none shadow-sm">
                            Update Quotation
                        </Button>
                    </div>
                </div>

                {/* Existing Items Table */}
                <Card className="p-0 overflow-hidden border-slate-200">
                    <div className="px-5 py-3 border-b bg-slate-50 font-bold text-slate-700">Items (Saved)</div>
                    <div className="overflow-x-auto">
                        <Table className="w-full text-sm">
                            <THead className="bg-slate-50/50">
                                <Tr>
                                    <Th className="px-4 py-2 border-r w-[20%]">Standard / Product</Th>
                                    <Th className="px-4 py-2 border-r w-[20%]">Grade / Size / Package</Th>
                                    <Th className="px-4 py-2 border-r w-[25%]">Sample Req.</Th>
                                    <Th className="px-4 py-2 border-r w-20 text-center">Qty</Th>
                                    <Th className="px-4 py-2 border-r w-24 text-right">Unit Cost</Th>
                                    <Th className="px-4 py-2 border-r w-28 text-right font-black">Total</Th>
                                    <Th className="px-4 py-2 text-center w-36">Actions</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {existingItems.map((item) => (
                                    <Tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/30">
                                        <Td className="px-4 py-3 border-r align-top">
                                            <div className="font-semibold text-slate-800">{item.product_name || item.product}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{item.standard_name || item.standard}</div>
                                        </Td>
                                        <Td className="px-4 py-3 border-r align-top text-slate-600">
                                            <div className="text-xs">{item.grade_name || item.grade} / {item.size_name || item.size}</div>
                                            <div className="text-[10px] text-slate-400 mt-1">{item.package_name || item.package}</div>
                                        </Td>
                                        <Td className="px-4 py-3 border-r align-top text-[11px] text-slate-500 italic">
                                            {item.sample_req || "-"}
                                        </Td>
                                        <Td className="px-4 py-3 border-r align-top text-center font-bold">{item.qty}</Td>
                                        <Td className="px-4 py-3 border-r align-top text-right text-slate-500">{item.unitcost}</Td>
                                        <Td className="px-4 py-3 border-r align-top text-right font-black text-slate-900">₹{parseFloat(item.total).toLocaleString()}</Td>
                                        <Td className="px-4 py-3 align-top">
                                            <div className="flex justify-center gap-1">
                                                <Button size="xs" variant="soft" className="bg-red-50 text-red-600 border-none" onClick={() => deleteExistingItem(item.id)}>Delete</Button>
                                                <Button size="xs" variant="soft" className="bg-blue-50 text-blue-600 border-none" onClick={() => cloneExistingItem(item)}>Clone</Button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                </Card>

                {/* New Items Construction area */}
                <Card className="p-0 overflow-visible border-blue-100 bg-blue-50/5">
                    <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/20 flex justify-between items-center">
                        <span className="font-bold text-blue-700">Add New Products</span>
                        <Button size="sm" onClick={addNewRow} className="!bg-blue-600 !text-white hover:!bg-blue-700 flex items-center gap-1 py-1 h-8 border-none shadow-sm">
                            <Plus size={14} /> Add Row
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="w-full text-xs">
                            <THead>
                                <Tr className="bg-slate-50/50">
                                    <Th className="px-4 py-2 w-12 text-center">S.No</Th>
                                    <Th className="px-4 py-2">Details (Standard / Product)</Th>
                                    <Th className="px-4 py-2 w-72">Spec (Grade/Size/Package)</Th>
                                    <Th className="px-4 py-2">Measurements (Sample Req / Qty / Cost / Total)</Th>
                                    <Th className="px-4 py-2 w-10"></Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {newItems.map((item, idx) => (
                                    <Tr key={item.tempId} className="border-b last:border-0 hover:bg-blue-50/30">
                                        <Td className="px-4 py-4 text-center align-top font-black text-slate-300">{idx + 1}</Td>
                                        <Td className="px-4 py-4 align-top space-y-2">
                                            <Select
                                                options={products.map(p => ({ value: p.id, label: p.name }))}
                                                value={products.map(p => ({ value: p.id, label: p.name })).find(o => String(o.value) === String(item.product)) || (item.product ? { value: item.product, label: item.product_name } : null)}
                                                placeholder="Product"
                                                onChange={(opt) => handleNewItemChange(idx, "product", opt?.value)}
                                                className="react-select-sm"
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            />
                                            <Select
                                                options={standards.map(s => ({ value: s.id, label: s.name }))}
                                                value={standards.map(s => ({ value: s.id, label: s.name })).find(o => String(o.value) === String(item.standard)) || (item.standard ? { value: item.standard, label: item.standard_name } : null)}
                                                placeholder="Standard"
                                                onChange={(opt) => handleNewItemChange(idx, "standard", opt?.value)}
                                                className="react-select-sm"
                                                menuPortalTarget={document.body}
                                            />
                                        </Td>
                                        <Td className="px-4 py-4 align-top space-y-2">
                                            <div className="flex gap-1">
                                                <Select
                                                    options={(newRowGrades[idx] || []).map(g => ({ value: g.id, label: g.name }))}
                                                    value={(newRowGrades[idx] || []).map(g => ({ value: g.id, label: g.name })).find(o => String(o.value) === String(item.grade)) || (item.grade ? { value: item.grade, label: item.grade_name } : null)}
                                                    placeholder="Grade"
                                                    onChange={(opt) => handleNewItemChange(idx, "grade", opt?.value)}
                                                    className="w-1/2 react-select-sm"
                                                    menuPortalTarget={document.body}
                                                />
                                                <Select
                                                    options={(newRowSizes[idx] || []).map(s => ({ value: s.id, label: s.name }))}
                                                    value={(newRowSizes[idx] || []).map(s => ({ value: s.id, label: s.name })).find(o => String(o.value) === String(item.size)) || (item.size ? { value: item.size, label: item.size_name } : null)}
                                                    placeholder="Size"
                                                    onChange={(opt) => handleNewItemChange(idx, "size", opt?.value)}
                                                    className="w-1/2 react-select-sm"
                                                    menuPortalTarget={document.body}
                                                />
                                            </div>
                                            <Select
                                                options={(newRowPackages[idx] || []).map(p => ({ value: p.id, label: p.name }))}
                                                value={(newRowPackages[idx] || []).map(p => ({ value: p.id, label: p.name })).find(o => String(o.value) === String(item.package)) || (item.package ? { value: item.package, label: item.package_name } : null)}
                                                placeholder="Package"
                                                onChange={(opt) => handleNewItemChange(idx, "package", opt?.value)}
                                                className="react-select-sm"
                                                menuPortalTarget={document.body}
                                            />
                                        </Td>
                                        <Td className="px-4 py-4 align-top space-y-2">
                                            <div className="p-2 bg-white border border-slate-200 rounded text-[10px] text-slate-500 italic h-10 overflow-hidden line-clamp-2">
                                                {newRowSamples[idx] || "Sample req..."}
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="number" value={item.qty} onChange={(e) => handleNewItemChange(idx, "qty", e.target.value)} className="w-16 border p-1 rounded h-8 text-center" />
                                                <input type="number" value={item.unitcost} onChange={(e) => handleNewItemChange(idx, "unitcost", e.target.value)} className="w-24 border p-1 rounded h-8 text-right" />
                                                <div className="flex-1 border bg-slate-50 p-1 rounded h-8 text-right font-bold flex items-center justify-end text-xs">₹{item.total.toLocaleString()}</div>
                                            </div>
                                        </Td>
                                        <Td className="px-4 py-4 align-top">
                                            <button onClick={() => setNewItems(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 mt-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                </Card>

                {/* Calculation Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 border-slate-200">
                        <h3 className="font-bold text-slate-700 border-b pb-2 mb-4">Service Charges</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-semibold text-slate-800">₹{totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex-1 text-slate-500">Discount ({taxData.disctype === "2" ? "%" : "₹"})</span>
                                <div className="flex gap-1 w-48">
                                    <input name="discnumber" type="number" value={taxData.discnumber} onChange={handleTaxChange} className="w-full border p-1 rounded text-center h-8" />
                                    <select name="disctype" value={taxData.disctype} onChange={handleTaxChange} className="border rounded h-8 text-xs px-1">
                                        <option value="1">₹</option>
                                        <option value="2">%</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded text-blue-800 font-bold border border-blue-100">
                                <span>After Discount</span>
                                <span>₹{totals.afterDiscount.toLocaleString()}</span>
                            </div>
                            {[{ key: 'mobilisation', l: 'Mobilisation' }, { key: 'sampleprep', l: 'Sample Prep.' }, { key: 'witness', l: 'Witness' }, { key: 'freight', l: 'Freight' }].map(c => (
                                <div key={c.key} className="flex items-center gap-4">
                                    <span className="flex-1 text-slate-500">{c.l} Charges</span>
                                    <input name={c.key} type="number" value={taxData[c.key]} onChange={handleTaxChange} className="w-48 border p-1 rounded text-right h-8" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-900 shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b pb-2 mb-4 text-center">Final Summary</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 text-slate-500 font-medium">GST (SGST + CGST)</div>
                                    <div className="flex gap-1 w-48">
                                        <input name="gstnumber" type="number" value={taxData.gstnumber} onChange={handleTaxChange} className="w-full border p-1 rounded text-center h-8" />
                                        <select name="gsttype" value={taxData.gsttype} onChange={handleTaxChange} className="border rounded h-8 text-xs px-1">
                                            <option value="1">₹</option>
                                            <option value="2">%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Calculated GST</span>
                                    <span className="font-semibold text-slate-900">+ ₹{totals.gstAmount.toLocaleString()}</span>
                                </div>
                                <div className="pt-6 border-t-2 border-dashed border-slate-200 mt-6 flex flex-col items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payable</span>
                                    <span className="text-4xl font-black text-blue-600 tracking-tighter">₹{totals.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 mt-8 !bg-blue-600 font-bold !text-white hover:!bg-blue-700 shadow-md border-none">
                            {submitting ? "Processing..." : "Submit Updated Quotation"}
                        </Button>
                    </Card>
                </div>
            </div>
        </Page>
    );
}
