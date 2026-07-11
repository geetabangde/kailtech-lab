import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { Plus, Trash2 } from "lucide-react";

// ----------------------------------------------------------------------

const TAX_TYPES = [
    { value: 1, label: "%" },
    { value: 2, label: "Fixed" },
];

const GST_TYPES = [
    { value: 1, label: "CGST + SGST (9%+9%)" },
    { value: 2, label: "IGST (18%)" },
];

export default function AddQuotationItems() {
    const { id } = useParams(); // Quotation ID
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

    useEffect(() => {
        if (!permissions.includes(94)) {
            navigate("/dashboards/sales/enquiry");
            toast.error("You don't have permission to add quotation items");
        }
    }, [navigate, permissions]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Dropdowns
    const [standards, setStandards] = useState([]);
    const [products, setProducts] = useState([]);

    // Quotation Header Data
    const [quoteData, setQuoteData] = useState(null);

    // Items list
    const [items, setItems] = useState([]);

    // Tax/Charges state
    const [taxData, setTaxData] = useState({
        discnumber: 0,
        disctype: 1,
        pchargesnumber: 0,
        pchargestype: 1,
        wchargesnumber: 0,
        wchargestype: 1,
        mobilisation: 0,
        gstnumber: 18,
        gsttype: 1,
        freight: 0,
    });

    // Per-row packages state
    const [rowPackages, setRowPackages] = useState({}); // { rowIndex: [packages] }
    const [rowGrades, setRowGrades] = useState({}); // { rowIndex: [grades] }
    const [rowSizes, setRowSizes] = useState({}); // { rowIndex: [sizes] }

    const fetchPackagesForIdx = useCallback(async (index, pid, verticalType = null) => {
        try {
            const vType = verticalType || quoteData?.vertical || (window.location.pathname.includes("calibration") ? 1 : 2);
            const res = await axios.get(`/testing/get-package-list?pid=${pid}&type=${vType}`);
            const pkgs = res.data?.data || [];
            setRowPackages(prev => ({ ...prev, [index]: pkgs }));
        } catch {
            console.warn(`Failed to fetch packages for row ${index}`);
        }
    }, [quoteData?.vertical]);

    const fetchGradesSizesForIdx = useCallback(async (index, pid) => {
        try {
            const res = await axios.get(`/testing/get-grade-and-size?pid=${pid}`);
            setRowGrades(prev => ({ ...prev, [index]: res.data?.grades || [] }));
            setRowSizes(prev => ({ ...prev, [index]: res.data?.sizes || [] }));
        } catch {
            console.warn(`Failed to fetch grades/sizes for row ${index}`);
        }
    }, []);

    // Fetch initial data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [quoteRes, stdRes, prodRes] = await Promise.all([
                axios.get(`/sales/get-quotation-item/${id}`).catch((error) => ({ data: null, error })),
                axios.get("/testing/get-standards"),
                axios.get("/testing/get-prodcut-list"),
            ]);

            if (quoteRes.data?.status) {
                const q = quoteRes.data.quotation?.[0];
                setQuoteData(q || null);

                const existingItems = quoteRes.data.items || [];
                if (existingItems.length === 0) {
                    // Start with an empty row if no existing items
                    setItems([{
                        standard: "",
                        product: "",
                        package: "",
                        qty: 1,
                        unitcost: 0,
                        total: 0,
                        isExisting: false,
                        tempId: Date.now()
                    }]);
                } else {
                    const initialItems = existingItems.map(item => ({
                        id: item.id,
                        standard: item.standard || "",
                        product: item.product || "",
                        package: item.package || "",
                        qty: item.qty || 1,
                        unitcost: item.unitcost || item.rate || 0,
                        total: item.total || 0,
                        product_name: item.product_name || "",
                        package_name: item.package_name || "",
                        standard_name: item.standard_name || "",
                        grade: item.grade || "",
                        size: item.size || "",
                        grade_name: item.grade_name || "",
                        size_name: item.size_name || "",
                        sample_requirement: item.sample_requirement || "",
                        isExisting: true
                    }));
                    setItems(initialItems);
                }

                if (q) {
                    setTaxData({
                        discnumber: q.discnumber || 0,
                        disctype: q.disctype || 1,
                        pchargesnumber: q.sampleprep || 0, // Mapping sampleprep to pcharges
                        pchargestype: 2, // Fixed
                        wchargesnumber: q.witness || 0, // Mapping witness to wcharges
                        wchargestype: 2, // Fixed
                        mobilisation: q.mobilisation || 0,
                        gstnumber: q.gstnumber || 18,
                        gsttype: q.gsttype || 1,
                        freight: q.freight || 0,
                    });
                }
                // Removed fallback block
            }

            if (stdRes.data?.data) setStandards(stdRes.data.data);
            if (prodRes.data?.data) setProducts(prodRes.data.data);

        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load quotation details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle adding a new row
    const addRow = () => {
        setItems(prev => [
            ...prev,
            {
                standard: "",
                product: "",
                package: "",
                qty: 1,
                unitcost: 0,
                total: 0,
                isExisting: false,
                tempId: Date.now()
            }
        ]);
    };

    const removeRow = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
        // Also cleanup rowPackages
        setRowPackages(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    const handleItemChange = async (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;

            if (field === "qty" || field === "unitcost") {
                updated[index].total = Number(updated[index].qty || 0) * Number(updated[index].unitcost || 0);
            }

            return updated;
        });

        // Cascading logic
        if (field === "product" && value) {
            const currentVertical = quoteData?.vertical || (window.location.pathname.includes("calibration") ? 1 : 2);
            fetchPackagesForIdx(index, value, currentVertical);
            fetchGradesSizesForIdx(index, value);
        }

        if (field === "package" && value) {
            const selectedPkg = rowPackages[index]?.find(p => String(p.id) === String(value));
            if (selectedPkg && selectedPkg.rate) {
                handleItemChange(index, "unitcost", selectedPkg.rate);
            }
        }
    };

    // Calculate Subtotal
    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    }, [items]);

    // Calculate Grand Total
    const totals = useMemo(() => {
        const {
            discnumber, disctype,
            pchargesnumber, pchargestype,
            wchargesnumber, wchargestype,
            mobilisation,
            gstnumber,
            freight
        } = taxData;

        let discount = 0;
        if (Number(disctype) === 1) {
            discount = (subtotal * Number(discnumber)) / 100;
        } else {
            discount = Number(discnumber);
        }

        const afterDiscount = subtotal - discount;

        let priority = 0;
        if (Number(pchargestype) === 1) {
            priority = (afterDiscount * Number(pchargesnumber)) / 100;
        } else {
            priority = Number(pchargesnumber);
        }

        let witness = 0;
        if (Number(wchargestype) === 1) {
            witness = (afterDiscount * Number(wchargesnumber)) / 100;
        } else {
            witness = Number(wchargesnumber);
        }

        const gstBase = afterDiscount + priority + witness + Number(mobilisation);
        const gstAmount = (gstBase * Number(gstnumber)) / 100;

        const grandTotal = gstBase + gstAmount + Number(freight);

        return {
            subtotal,
            discount,
            afterDiscount,
            priority,
            witness,
            gstAmount,
            grandTotal
        };
    }, [subtotal, taxData]);

    const handleTaxChange = (e) => {
        const { name, value } = e.target;
        setTaxData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const activeItems = items.filter((item) => item.product && item.package);
            if (activeItems.length === 0) {
                toast.error("Please add at least one quotation item");
                return;
            }

            const payload = {
                quotation: Number(quoteData?.id || id),
                products: activeItems.map((item) => Number(item.product)),
                packages: activeItems.map((item) => Number(item.package)),
                grades: activeItems.map((item) => Number(item.grade || 0)),
                sizes: activeItems.map((item) => Number(item.size || 0)),
                standards: activeItems.map((item) => Number(item.standard || 0)),
                qty: activeItems.map((item) => Number(item.qty || 0)),
                unitcosts: activeItems.map((item) => Number(item.unitcost || 0)),
                totals: activeItems.map((item) => Number(item.total || 0)),
                employeeid: Number(localStorage.getItem("userId") || 0),
            };

            const res = await axios.post("/sales/add-testing-quotation-item", payload);
            if (res.data.status) {
                toast.success("Quotation items saved successfully ✅");
                const baseRoute = String(quoteData?.vertical) === "1" ? "calibration-quotations" : "testing-quotations";
                navigate(`/dashboards/sales/${baseRoute}`);
            } else {
                toast.error(res.data.message || "Failed to save items");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error saving quotation items");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Page title="Quotation Items">
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="font-medium text-gray-500">Loading quotation items...</p>
                </div>
            </Page>
        );
    }

    return (
        <Page title="Quotation Items">
            <div className="transition-content px-[var(--margin-x)] pb-8">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                            Quote Items
                        </h1>
                        <p className="text-xs font-medium text-gray-500">
                            Quotation ID: {quoteData?.id || id} | Customer: {quoteData?.customername || "N/A"}
                        </p>
                    </div>
                    <Link to="/dashboards/sales/enquiry">
                        <Button variant="outline" className="text-white bg-blue-600 hover:bg-blue-700">
                            &lt;&lt; Back
                        </Button>
                    </Link>
                </div>

                <Card className="p-6 mb-6">
                    <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            2. Testing Request (Equipment Description)
                        </h3>
                        <Button
                            onClick={addRow}
                            size="sm"
                            className="!bg-blue-600 !text-white hover:!bg-blue-700 flex items-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <THead>
                                <Tr>
                                    <Th className="w-12 text-center">SN</Th>
                                    <Th className="min-w-[200px]">Standard</Th>
                                    <Th className="min-w-[250px]">Product</Th>
                                    <Th className="min-w-[180px]">Grade</Th>
                                    <Th className="min-w-[180px]">Size</Th>
                                    <Th className="min-w-[300px]">Package</Th>
                                    <Th className="w-24">Qty</Th>
                                    <Th className="w-32">Unit Cost</Th>
                                    <Th className="w-32">Total</Th>
                                    <Th className="w-12 text-center">Action</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {items.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={10} className="text-center py-8 text-gray-500 italic">
                                            No items added. Click &quot;Add Item&quot; to start.
                                        </Td>
                                    </Tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <Tr key={item.id || item.tempId}>
                                            <Td className="text-center font-medium">{idx + 1}</Td>
                                            <Td>
                                                <Select
                                                    options={standards.map(s => ({ value: s.id, label: s.name }))}
                                                    value={
                                                        standards.map(s => ({ value: s.id, label: s.name })).find(o => String(o.value) === String(item.standard))
                                                        || (item.standard ? { value: item.standard, label: item.standard_name } : null)
                                                    }
                                                    onChange={(opt) => handleItemChange(idx, "standard", opt?.value)}
                                                    placeholder="Standard"
                                                    isSearchable
                                                    className="react-select-sm"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </Td>
                                            <Td>
                                                <Select
                                                    options={products.map(p => ({ value: p.id, label: p.name + (p.description ? ` (${p.description})` : "") }))}
                                                    value={
                                                        products.map(p => ({ value: p.id, label: p.name })).find(o => String(o.value) === String(item.product))
                                                        || (item.product ? { value: item.product, label: item.product_name } : null)
                                                    }
                                                    onChange={(opt) => handleItemChange(idx, "product", opt?.value)}
                                                    placeholder="Product"
                                                    isSearchable
                                                    className="react-select-sm"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </Td>
                                            <Td>
                                                <Select
                                                    options={(rowGrades[idx] || []).map(g => ({ value: g.id, label: g.name }))}
                                                    value={
                                                        (rowGrades[idx] || []).map(g => ({ value: g.id, label: g.name })).find(o => String(o.value) === String(item.grade))
                                                        || (item.grade ? { value: item.grade, label: item.grade_name } : null)
                                                    }
                                                    onChange={(opt) => handleItemChange(idx, "grade", opt?.value)}
                                                    placeholder="Grade"
                                                    isSearchable
                                                    className="react-select-sm"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </Td>
                                            <Td>
                                                <Select
                                                    options={(rowSizes[idx] || []).map(s => ({ value: s.id, label: s.name }))}
                                                    value={
                                                        (rowSizes[idx] || []).map(s => ({ value: s.id, label: s.name })).find(o => String(o.value) === String(item.size))
                                                        || (item.size ? { value: item.size, label: item.size_name } : null)
                                                    }
                                                    onChange={(opt) => handleItemChange(idx, "size", opt?.value)}
                                                    placeholder="Size"
                                                    isSearchable
                                                    className="react-select-sm"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </Td>
                                            <Td>
                                                <Select
                                                    options={(rowPackages[idx] || []).map(p => ({ value: p.id, label: p.package + ` (₹${p.rate})` }))}
                                                    value={
                                                        (rowPackages[idx] || []).map(p => ({ value: p.id, label: p.package })).find(o => String(o.value) === String(item.package))
                                                        || (item.package ? { value: item.package, label: item.package_name } : null)
                                                    }
                                                    onChange={(opt) => handleItemChange(idx, "package", opt?.value)}
                                                    placeholder="Package"
                                                    isSearchable
                                                    className="react-select-sm"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </Td>
                                            <Td>
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </Td>
                                            <Td>
                                                <input
                                                    type="number"
                                                    value={item.unitcost}
                                                    onChange={(e) => handleItemChange(idx, "unitcost", e.target.value)}
                                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                                                />
                                            </Td>
                                            <Td className="font-bold text-gray-800 dark:text-white">
                                                ₹ {Number(item.total).toLocaleString()}
                                            </Td>
                                            <Td className="text-center">
                                                <button
                                                    onClick={() => removeRow(idx)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </div>
                </Card>

                {/* Totals and Submission */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5 border-b pb-2 border-gray-100 dark:border-gray-700">
                            Extra Charges & Taxes
                        </h3>
                        <div className="space-y-4">
                            {/* Discount */}
                            <div className="grid grid-cols-3 gap-3 items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Discount</label>
                                <input
                                    type="number"
                                    name="discnumber"
                                    value={taxData.discnumber}
                                    onChange={handleTaxChange}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm"
                                />
                                <Select
                                    options={TAX_TYPES}
                                    value={TAX_TYPES.find(o => o.value === Number(taxData.disctype))}
                                    onChange={(opt) => handleTaxChange({ target: { name: "disctype", value: opt.value } })}
                                    className="react-select-sm"
                                />
                            </div>

                            {/* Priority Charges */}
                            <div className="grid grid-cols-3 gap-3 items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority Charges</label>
                                <input
                                    type="number"
                                    name="pchargesnumber"
                                    value={taxData.pchargesnumber}
                                    onChange={handleTaxChange}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm"
                                />
                                <Select
                                    options={TAX_TYPES}
                                    value={TAX_TYPES.find(o => o.value === Number(taxData.pchargestype))}
                                    onChange={(opt) => handleTaxChange({ target: { name: "pchargestype", value: opt.value } })}
                                    className="react-select-sm"
                                />
                            </div>

                            {/* Witness Charges */}
                            <div className="grid grid-cols-3 gap-3 items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Witness Charges</label>
                                <input
                                    type="number"
                                    name="wchargesnumber"
                                    value={taxData.wchargesnumber}
                                    onChange={handleTaxChange}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm"
                                />
                                <Select
                                    options={TAX_TYPES}
                                    value={TAX_TYPES.find(o => o.value === Number(taxData.wchargestype))}
                                    onChange={(opt) => handleTaxChange({ target: { name: "wchargestype", value: opt.value } })}
                                    className="react-select-sm"
                                />
                            </div>

                            {/* Mobilisation */}
                            <div className="grid grid-cols-3 gap-3 items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobilisation</label>
                                <input
                                    type="number"
                                    name="mobilisation"
                                    value={taxData.mobilisation}
                                    onChange={handleTaxChange}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm col-span-1"
                                />
                                <span className="text-xs text-gray-400">(Fix Amount)</span>
                            </div>

                            {/* GST */}
                            <div className="grid grid-cols-3 gap-3 items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">GST (%)</label>
                                <input
                                    type="number"
                                    name="gstnumber"
                                    value={taxData.gstnumber}
                                    onChange={handleTaxChange}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm"
                                />
                                <Select
                                    options={GST_TYPES}
                                    value={GST_TYPES.find(o => o.value === Number(taxData.gsttype))}
                                    onChange={(opt) => handleTaxChange({ target: { name: "gsttype", value: opt.value } })}
                                    className="react-select-sm"
                                />
                            </div>

                            {/* Freight */}
                            <div className="grid grid-cols-3 gap-3 items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Freight</label>
                                <input
                                    type="number"
                                    name="freight"
                                    value={taxData.freight}
                                    onChange={handleTaxChange}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 p-2 text-sm col-span-1"
                                />
                                <span className="text-xs text-gray-400">(Fix Amount)</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gray-50 dark:bg-dark-900 border-none shadow-inner">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5 border-b pb-2 border-gray-200 dark:border-gray-700">
                            Order Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span className="font-medium text-gray-800 dark:text-white">₹ {totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500">
                                <span>Discount</span>
                                <span>- ₹ {totals.discount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-gray-700 dark:text-gray-300">Amount After Discount</span>
                                <span className="text-gray-900 dark:text-white">₹ {totals.afterDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Priority Charges</span>
                                <span className="font-medium">₹ {totals.priority.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Witness Charges</span>
                                <span className="font-medium">₹ {totals.witness.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Mobilisation</span>
                                <span className="font-medium">₹ {Number(taxData.mobilisation).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">GST Amount</span>
                                <span className="font-medium">₹ {totals.gstAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Freight</span>
                                <span className="font-medium">₹ {Number(taxData.freight).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between text-xl font-bold pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-600 mt-4">
                                <span className="text-gray-800 dark:text-white">Grand Total</span>
                                <span className="text-blue-600 dark:text-blue-400">₹ {totals.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <Button
                                disabled={submitting}
                                className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-dark-700 dark:text-dark-200"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="w-full bg-green-600 text-white hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"
                            >
                                {submitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                Submit Quotation
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </Page>
    );
}