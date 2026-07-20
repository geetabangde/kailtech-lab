import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Card, Button, Table, TBody, Tr, Td } from "components/ui";
import { ConfirmModal } from "components/shared/ConfirmModal";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { Plus, Trash2, Save } from "lucide-react";

// ----------------------------------------------------------------------

export default function EditTQuotationItem() {
    const { id } = useParams();
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

    useEffect(() => {
        if (!permissions.includes(95)) {
            navigate("/dashboards/sales/testing-quotations");
        }
    }, [navigate, permissions]);

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

    const [dependentData, setDependentData] = useState({});
    const [sampleReqs, setSampleReqs] = useState({});
    const [packageParams, setPackageParams] = useState({});
    const [deleteModal, setDeleteModal] = useState({ show: false, itemId: null, state: 'pending' });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch dependencies for a product (Packages, Grades, Sizes)
    const fetchProductDependents = useCallback(async (index, productId) => {
        if (!productId) return;
        try {
            const vertical = quoteData?.vertical || 2;
            console.log(`Fetching packages for product ${productId}, vertical: ${vertical}`);

            const [pkgRes, gsRes] = await Promise.all([
                axios.get(`/testing/get-package-list?pid=${productId}&type=${vertical}`),
                axios.get(`/testing/get-grade-and-size?pid=${productId}`)
            ]);

            console.log('Package response:', pkgRes.data);
            console.log('Grade/Size response:', gsRes.data);

            setDependentData(prev => ({
                ...prev,
                [index]: {
                    packages: pkgRes.data?.data || [],
                    grades: gsRes.data?.grades || [],
                    sizes: gsRes.data?.sizes || []
                }
            }));
        } catch (err) {
            console.error("Error fetching product dependents:", err);
            toast.error("Failed to load product options");
        }
    }, [quoteData?.vertical]);

    // Fetch package parameters - matching PHP fetchparameterforpackage.php logic
    const fetchPackageParameters = useCallback(async (index, packageId) => {
        if (!packageId) return;
        try {
            // Based on PHP: $iresult=$obj->selectextrawhere("packageparameters", "package=$pid and status=1");
            const res = await axios.get(`/testing/package-parameters/${packageId}`);
            if (res.data?.status && res.data.parameters) {
                setPackageParams(prev => ({ ...prev, [index]: res.data.parameters }));
            } else {
                setPackageParams(prev => ({ ...prev, [index]: [] }));
            }
        } catch (err) {
            console.error("Error fetching package parameters:", err);
            setPackageParams(prev => ({ ...prev, [index]: [] }));
        }
    }, []);

    // Fetch sample requirements for a package - using package_quantity from API response
    const fetchPackageSampleReq = useCallback(async (index, packageId) => {
        if (!packageId) return;
        try {
            // Try to get package quantity from package parameters API response
            const res = await axios.get(`/testing/package-parameters/${packageId}`);
            if (res.data?.status && res.data.package_quantity) {
                // Based on response: "package_quantity": [{"name": ".", "quantity": 2, "unit": "No's"}]
                const reqs = res.data.package_quantity.map(q => `${q.name} ${q.quantity} ${q.unit}`).join(", ");
                setSampleReqs(prev => ({ ...prev, [index]: reqs }));
            }
        } catch (err) {
            console.error("Error fetching sample requirements:", err);
            // Don't show error toast for this - it's optional functionality
        }
    }, []);

    const addProductsToQuotation = async () => {
        if (newItems.length === 0) {
            toast.error("Please add at least one product");
            return;
        }

        try {
            // Build parameters object dynamically based on selected packages
            const parametersObj = {};
            newItems.forEach((item) => {
                if (item.package) {
                    // Get selected parameters for this package
                    const checkboxes = document.querySelectorAll(`input[name="parameters${item.package}[]"]:checked`);
                    const selectedParams = Array.from(checkboxes).map(cb => cb.value);
                    parametersObj[`parameters${item.package}`] = selectedParams;
                }
            });

            const payload = {
                quotation: quoteData?.id || id,
                products: newItems.map(item => item.product),
                packages: newItems.map(item => item.package),
                grades: newItems.map(item => item.grade),
                sizes: newItems.map(item => item.size),
                standards: newItems.map(item => item.standard),
                qty: newItems.map(item => item.qty),
                unitcosts: newItems.map(item => item.unitcost),
                totals: newItems.map(item => item.total),
                ...parametersObj // Spread the dynamic parameters object
            };

            const response = await axios.post("/sales/add-testing-quotation-item", payload);

            if (response.data?.status) {
                toast.success(response.data.message || "Products added successfully");
                setNewItems([]); // Clear the new items after successful addition
                // Refresh the quotation data to show the new items
                fetchData();
            } else {
                toast.error(response.data.message || "Failed to add products");
            }
        } catch (err) {
            console.error("Error adding products:", err);
            toast.error("Error adding products");
        }
    };

    const fetchData = useCallback(async (isInitial = false) => {
        try {
            setLoading(true);
            const [quoteRes, stdRes, prodRes] = await Promise.all([
                axios.get(`/sales/get-testing-quotation-itemdetail-byid/${id}`),
                axios.get("/testing/get-standards"),
                axios.get("/testing/get-prodcut-list")
            ]);

            if (quoteRes.data?.status) {
                const q = quoteRes.data.quotation;
                setQuoteData(q || null);
                
                if (isInitial) {
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
                }
                setExistingItems(quoteRes.data.items || []);
                console.log('Fetched existing items:', quoteRes.data.items);
            }
            setStandards(stdRes.data?.data || []);
            setProducts(prodRes.data?.data || []);
        } catch (err) {
            console.error("Error loading initial data:", err);
            toast.error("Failed to load quotation items");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    const addNewRow = () => {
        setNewItems(prev => [
            ...prev,
            {
                standard: "",
                product: "",
                grade: "",
                size: "",
                package: "",
                qty: 1,
                unitcost: 0,
                total: 0,
                tempId: Date.now()
            }
        ]);
    };

    const handleNewItemChange = (index, field, value) => {
        setNewItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;

            // Auto-calculate total for row
            if (field === "qty" || field === "unitcost") {
                updated[index].total = Number(updated[index].qty || 0) * Number(updated[index].unitcost || 0);
            }
            return updated;
        });

        if (field === "product" && value) {
            fetchProductDependents(index, value);
        }

        if (field === "package" && value) {
            const pkgs = dependentData[index]?.packages || [];
            const pkg = pkgs.find(p => String(p.id) === String(value));
            if (pkg?.rate) {
                handleNewItemChange(index, "unitcost", pkg.rate);
            }
            fetchPackageSampleReq(index, value); // Re-enabled - using package_quantity from API
            fetchPackageParameters(index, value); // Fetch package parameters
        }
    };

    const removeNewRow = (index) => {
        setNewItems(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllNewRows = () => {
        setNewItems([]);
    };

    const deleteExistingItem = (itemId) => {
        setDeleteModal({ show: true, itemId, state: 'pending' });
    };

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true);
        try {
            const res = await axios.delete(`/sales/delete-testing-quotationitem/${deleteModal.itemId}`);
            if (res.data.status) {
                setExistingItems(prev => prev.filter(item => item.id !== deleteModal.itemId));
                setDeleteModal({ show: true, itemId: null, state: 'success' });
                toast.success("Item deleted successfully");
            } else {
                setDeleteModal({ show: true, itemId: deleteModal.itemId, state: 'error' });
                toast.error(res.data.message || "Failed to delete item");
            }
        } catch (err) {
            console.error("Delete error:", err);
            setDeleteModal({ show: true, itemId: deleteModal.itemId, state: 'error' });
            toast.error("Error deleting item");
        } finally {
            setDeleteLoading(false);
        }
    };


    const handleDeleteClose = () => {
        setDeleteModal({ show: false, itemId: null, state: 'pending' });
        setDeleteLoading(false);
    };

    const cloneExistingItem = async (item) => {
        try {
            // Updated to use the correct API endpoint for cloning
            const res = await axios.get(`/sales/get-testing-quotation-item-byid/${item.id}`);
            if (res.data.status) {
                const cloned = res.data.data.item;
                const index = newItems.length;

                setNewItems(prev => [
                    ...prev,
                    {
                        standard: cloned.standard,
                        product: cloned.product,
                        grade: cloned.grade,
                        size: cloned.size,
                        package: cloned.package,
                        qty: Number(cloned.qty) || 1,
                        unitcost: Number(cloned.unitcost) || 0,
                        total: Number(cloned.total) || 0,
                        tempId: Date.now()
                    }
                ]);

                // Fetch dependents for the cloned row
                fetchProductDependents(index, cloned.product);
                if (cloned.package) fetchPackageSampleReq(index, cloned.package); // Re-enabled for sample requirements
                if (cloned.package) fetchPackageParameters(index, cloned.package); // Fetch parameters for cloned package

                toast.success("Item cloned to new rows");
            } else {
                toast.error(res.data.message || "Failed to clone item");
            }
        } catch (err) {
            console.error("Clone error:", err);
            toast.error("Error cloning item");
        }
    };

    const totals = useMemo(() => {
        const subtotal = [...existingItems, ...newItems].reduce((sum, item) => sum + Number(item.total || 0), 0);
        const { discnumber, disctype, mobilisation, witness, sampleprep, gstnumber, gsttype, freight } = taxData;

        let discount = 0;
        if (Number(discnumber) !== 0) {
            discount = Number(disctype) === 2 ? (subtotal * Number(discnumber)) / 100 : Number(discnumber);
        }

        const afterDiscount = subtotal - discount;
        const baseForGst = afterDiscount + Number(mobilisation) + Number(sampleprep) + Number(witness) + Number(freight);

        let gstAmount = 0;
        if (Number(gstnumber) !== 0) {
            gstAmount = Number(gsttype) === 2 ? (baseForGst * Number(gstnumber)) / 100 : Number(gstnumber);
        }

        return {
            subtotal,
            discount,
            afterDiscount,
            gstAmount,
            total: baseForGst + gstAmount
        };
    }, [existingItems, newItems, taxData]);


    const handleUpdateQuotation = async () => {
        setSubmitting(true);
        try {
            const payload = {
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
                id: String(id)
            };


            const res = await axios.post("/sales/update-testing-quotation-item", payload);
            if (res.data.status === true) {
                toast.success(res.data.message || "Quotation Details Updated Successfully");
                navigate("/dashboards/sales/testing-quotations");
            } else {
                toast.error(res.data.message || "Update failed");
            }
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Error updating quotation items");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Page title="Edit Quotation Items">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
            </Page>
        );
    }

    return (
        <Page title="Edit Quotation Items (Testing)">
            <div className="transition-content px-[var(--margin-x)] pb-8">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboards/sales/testing-quotations"
                            className="rounded-full p-1.5 dark:hover:bg-dark-700"
                        >
                            <Button variant="outline" className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
                                &lt;&lt; Back to List
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                            Edit Quotation Items
                        </h1>
                    </div>
                    {quoteData && (
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-500">Quotation No</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {quoteData.quotationno || quoteData.id || id}
                            </div>
                        </div>
                    )}
                </div>

                {/* Current Items */}
                <Card className="mb-6 overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50 dark:bg-dark-700">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">PRODUCT /<br /> STANDARD</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">SPECIFICATIONS<br /> (GRADE/SIZE/PKG)</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">QTY</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">UNIT COST</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">TOTAL</th>
                                    <th className="w-16 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">ACTIONS</th>
                                </tr>
                            </thead>
                            <TBody>
                                {existingItems.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={6} className="py-10 text-center text-gray-500">
                                            No items found in this quotation.
                                        </Td>
                                    </Tr>
                                ) : (
                                    existingItems.map((item) => (
                                        <Tr key={item.id} className="border-b dark:border-dark-600 group hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                                            <Td className="px-4 py-2">
                                                <div className="font-medium text-gray-700 dark:text-dark-200">
                                                    {item.product_name || item.product}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-dark-400">
                                                    {item.standard_name || item.standard}
                                                </div>
                                            </Td>
                                            <Td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-400">
                                                <div>
                                                    {item.grade} / {item.size}
                                                </div>
                                                <div className="text-xs text-gray-400 italic">
                                                    {item.package}
                                                </div>
                                            </Td>
                                            <Td className="px-2 py-2 text-center font-medium">{item.qty}</Td>
                                            <Td className="px-2 py-2 text-left text-gray-700">₹{parseFloat(item.unitcost).toLocaleString()}</Td>
                                            <Td className="px-2 py-2 text-left font-bold text-gray-900">₹{parseFloat(item.total).toLocaleString()}</Td>
                                            <Td className="px-4 py-2 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => deleteExistingItem(item.id)}
                                                        className="inline-flex items-center justify-center rounded-md bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 min-w-[60px]"
                                                        title="Delete"
                                                    >
                                                        <span>Delete</span>
                                                    </button>
                                                    <button
                                                        onClick={() => cloneExistingItem(item)}
                                                        className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[60px]"
                                                        title="Clone"
                                                    >
                                                        <span>Clone</span>
                                                    </button>
                                                </div>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </div>
                    {existingItems.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600">
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {existingItems.length} Saved
                            </span>
                        </div>
                    )}
                </Card>

                {/* Add New Products */}
                <Card className="mb-6 overflow-hidden shadow-md">
                    <div className="border-b bg-gray-50 px-6 py-4 flex justify-between items-center dark:bg-dark-700">
                        <h3 className="font-semibold text-gray-800 dark:text-dark-100">Add New Products</h3>
                        <Button
                            onClick={addNewRow}
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            color="primary"
                        >
                            <Plus size={14} className="mr-1" /> Add Item
                        </Button>
                    </div>
                    <div className="p-4">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 align-top">
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300 border-r border-gray-200 w-16">S.No</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300 border-r border-gray-200" style={{ width: '35%' }}>Product</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300 border-r border-gray-200" style={{ width: '20%' }}>Grade/Size/Package</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300 border-r border-gray-200" style={{ width: '30%' }}>Required Sample Qty / Qty / Unit Cost / Total</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300 border-r border-gray-200 w-16">Close</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newItems.map((item, idx) => (
                                    <tr key={item.tempId} className="border-b border-gray-200 align-top hover:bg-gray-50 dark:hover:bg-dark-700/50">
                                        <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200">Item no {idx + 1}</td>
                                        <td className="px-3 py-3 border-r border-gray-200">
                                            <div className="space-y-3">
                                                <div>
                                                    <Select
                                                        options={products.map(p => ({ value: p.id, label: p.description ? `${p.description} - ${p.name}` : p.name }))}
                                                        value={products.map(p => ({ value: p.id, label: p.description ? `${p.description} - ${p.name}` : p.name })).find(o => String(o.value) === String(item.product)) || null}
                                                        placeholder="Select Product"
                                                        onChange={(opt) => handleNewItemChange(idx, "product", opt?.value)}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        menuPortalTarget={document.body}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                    />
                                                </div>
                                                <div>
                                                    <Select
                                                        options={standards.map(s => ({ value: s.id, label: s.name }))}
                                                        value={standards.map(s => ({ value: s.id, label: s.name })).find(o => String(o.value) === String(item.standard)) || null}
                                                        placeholder="Select Standard"
                                                        onChange={(opt) => handleNewItemChange(idx, "standard", opt?.value)}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        menuPortalTarget={document.body}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 border-r border-gray-200">
                                            <div className="space-y-3">
                                                <div>
                                                    <Select
                                                        options={(dependentData[idx]?.grades || []).map(g => ({ value: g.id, label: g.name }))}
                                                        value={(dependentData[idx]?.grades || []).map(g => ({ value: g.id, label: g.name })).find(o => String(o.value) === String(item.grade)) || null}
                                                        placeholder="Grade"
                                                        onChange={(opt) => handleNewItemChange(idx, "grade", opt?.value)}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        menuPortalTarget={document.body}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                    />
                                                </div>
                                                <div>
                                                    <Select
                                                        options={(dependentData[idx]?.sizes || []).map(s => ({ value: s.id, label: s.name }))}
                                                        value={(dependentData[idx]?.sizes || []).map(s => ({ value: s.id, label: s.name })).find(o => String(o.value) === String(item.size)) || null}
                                                        placeholder="Size"
                                                        onChange={(opt) => handleNewItemChange(idx, "size", opt?.value)}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        menuPortalTarget={document.body}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                    />
                                                </div>
                                                <div>
                                                    <Select
                                                        options={(dependentData[idx]?.packages || []).map(p => ({ value: p.id, label: p.package }))}
                                                        value={(dependentData[idx]?.packages || []).map(p => ({ value: p.id, label: p.package })).find(o => String(o.value) === String(item.package)) || null}
                                                        placeholder="Select Package"
                                                        onChange={(opt) => handleNewItemChange(idx, "package", opt?.value)}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        menuPortalTarget={document.body}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                    />
                                                    {packageParams[idx] && packageParams[idx].length > 0 && (
                                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                                            <div className="font-semibold text-blue-700 mb-1">Parameters Of Package</div>
                                                            <div className="space-y-1">
                                                                {packageParams[idx].map((param, paramIndex) => (
                                                                    <div key={paramIndex} className="flex items-center gap-2 text-xs text-gray-600">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-gray-300"
                                                                            defaultChecked={param.special}
                                                                            name={`parameters${item.package}[]`}
                                                                        />
                                                                        <label>{param.name}</label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 border-r border-gray-200">
                                            <div className="space-y-3">
                                                {sampleReqs[idx] && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Package Quantity</label>
                                                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 border border-gray-300 rounded px-3 py-2">
                                                            {sampleReqs[idx]}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => handleNewItemChange(idx, "qty", e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter quantity"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Per/Unit</label>
                                                    <input
                                                        type="number"
                                                        value={item.unitcost}
                                                        onChange={(e) => handleNewItemChange(idx, "unitcost", e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter unit cost"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total</label>
                                                    <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                        ₹{item.total.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={() => removeNewRow(idx)}
                                                className="inline-flex items-center justify-center rounded-md bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 min-w-[60px]"
                                                title="Remove item"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {newItems.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 flex justify-between items-center">
                            <Button
                                onClick={addProductsToQuotation}
                                disabled={loading}
                                className="h-8 text-xs font-semibold"
                                color="primary"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border border-gray-300 border-t-transparent animate-spin rounded-full"></div>
                                        Saving...
                                    </div>
                                ) : (
                                    <>
                                        <Save size={14} className="mr-1" /> Add Products
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={clearAllNewRows}
                                variant="outlined"
                                className="h-8 text-xs"
                            >
                                Clear All
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Totals and Charges Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100">Financial Details</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-1 block">Discount</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={taxData.discnumber}
                                            onChange={(e) => setTaxData(prev => ({ ...prev, discnumber: e.target.value }))}
                                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <select
                                            value={taxData.disctype}
                                            onChange={(e) => setTaxData(prev => ({ ...prev, disctype: e.target.value }))}
                                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="1">₹</option>
                                            <option value="2">%</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-1 block">Mobilisation & Demobilisation</label>
                                    <input
                                        type="number"
                                        value={taxData.mobilisation}
                                        onChange={(e) => setTaxData(prev => ({ ...prev, mobilisation: e.target.value }))}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Mobilisation Charges"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-1 block">Witness Charges</label>
                                    <input
                                        type="number"
                                        value={taxData.witness}
                                        onChange={(e) => setTaxData(prev => ({ ...prev, witness: e.target.value }))}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Witness Charges"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-1 block">Sample Prep Charges</label>
                                    <input
                                        type="number"
                                        value={taxData.sampleprep}
                                        onChange={(e) => setTaxData(prev => ({ ...prev, sampleprep: e.target.value }))}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Sample Prep Charges"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-1 block">Freight Charges</label>
                                    <input
                                        type="number"
                                        value={taxData.freight}
                                        onChange={(e) => setTaxData(prev => ({ ...prev, freight: e.target.value }))}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Freight Charges"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t dark:border-dark-600">
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Tax Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-1 block">GST (SGST + CGST)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={taxData.gstnumber}
                                                onChange={(e) => setTaxData(prev => ({ ...prev, gstnumber: e.target.value }))}
                                                className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <select
                                                value={taxData.gsttype}
                                                onChange={(e) => setTaxData(prev => ({ ...prev, gsttype: e.target.value }))}
                                                className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-16 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="1">₹</option>
                                                <option value="2">%</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-slate-50 dark:bg-dark-800/50 border-l-4 border-blue-600">
                        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100">Billing Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Subtotal 1</span>
                                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Discount Applied</span>
                                <span className="font-medium text-red-500">- ₹ {totals.discount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Amount After Discount</span>
                                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {totals.afterDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Mobilisation & Demobilisation Charges</span>
                                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {Number(taxData.mobilisation || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Witness Charges</span>
                                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {Number(taxData.witness || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Sample Prep Charges</span>
                                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {Number(taxData.sampleprep || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-dark-300">
                                <span>Freight Charges</span>
                                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {Number(taxData.freight || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 dark:border-dark-600 pt-2 font-bold text-gray-800 dark:text-dark-100">
                                <span>Subtotal 2</span>
                                <span>₹ {totals.afterDiscount.toLocaleString()}</span>
                            </div>

                            <div className="space-y-1 pt-2 bg-white/50 dark:bg-dark-900/50 p-3 rounded-lg border border-gray-100 dark:border-dark-700">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-dark-400">
                                    <span>GST ({taxData.gstnumber}{taxData.gsttype === "2" ? "%" : ""})</span>
                                    <span className="font-semibold text-gray-800 dark:text-dark-200">₹ {totals.gstAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-300 dark:border-dark-500 mt-4">
                                <div className="text-base font-semibold text-gray-800 dark:text-gray-100">Total Testing Charges</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    ₹ {totals.total.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button
                                onClick={handleUpdateQuotation}
                                disabled={submitting || existingItems.length === 0}
                                className="w-full h-11 text-base font-semibold shadow-sm"
                                color="primary"
                            >
                                {submitting ? "Updating..." : "Update Quotation Items"}
                            </Button>
                            {existingItems.length === 0 && (
                                <p className="text-center text-xs text-red-400 mt-3 font-medium">
                                    * Please save at least one product before updating quotation totals
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                show={deleteModal.show}
                onClose={handleDeleteClose}
                onOk={handleDeleteConfirm}
                confirmLoading={deleteLoading}
                state={deleteModal.state}
                messages={{
                    pending: {
                        title: "Delete Quotation Item",
                        description: "Are you sure you want to delete this quotation item? This action cannot be undone.",
                        actionText: "Delete"
                    },
                    success: {
                        title: "Item Deleted",
                        description: "The quotation item has been successfully deleted.",
                        actionText: "Done"
                    },
                    error: {
                        title: "Delete Failed",
                        description: "Failed to delete the quotation item. Please try again.",
                        actionText: "Retry"
                    }
                }}
            />
        </Page>
    );
}