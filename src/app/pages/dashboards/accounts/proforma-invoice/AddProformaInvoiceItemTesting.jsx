import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import Select from "react-select";

const labelCls =
    "dark:text-dark-300 mb-1 block text-sm font-medium text-gray-700";

const COMPANY_STATE_CODE = "23";

const CATEGORY_MAP = { 0: "General", 1: "BIS" };

function Spinner({ text = "Loading..." }) {
    return (
        <div className="flex h-[60vh] items-center justify-center gap-2 text-gray-600">
            <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
            </svg>
            {text}
        </div>
    );
}

function calcTotals(items, charges) {
    const subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const discnumber = parseFloat(charges.discnumber) || 0;
    const disctype = charges.disctype || "%";
    const discount = disctype === "%" ? (subtotal / 100) * discnumber : discnumber;
    const freight = parseFloat(charges.freight) || 0;
    const mobilisation = parseFloat(charges.mobilisation) || 0;

    const witnessnumber = parseFloat(charges.witnessnumber) || 0;
    const witnesstype = charges.witnesstype || "amount";
    const witnesscharges = witnesstype === "%" ? (subtotal / 100) * witnessnumber : witnessnumber;

    const samplehandling = parseFloat(charges.samplehandling) || 0;
    const sampleprep = parseFloat(charges.sampleprep) || 0;

    let subtotal2 = subtotal - discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep;

    const isSgst = String(charges.statecode || "").padStart(2, "0") === COMPANY_STATE_CODE;
    const cgstper = parseFloat(charges.cgstper) || 0;
    const sgstper = parseFloat(charges.sgstper) || 0;
    const igstper = parseFloat(charges.igstper) || 0;

    const cgstamount = isSgst ? parseFloat(((subtotal2 / 100) * cgstper).toFixed(2)) : 0;
    const sgstamount = isSgst ? parseFloat(((subtotal2 / 100) * sgstper).toFixed(2)) : 0;
    const igstamount = !isSgst ? parseFloat(((subtotal2 / 100) * igstper).toFixed(2)) : 0;
    const total = parseFloat((subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2));

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        witnesscharges: parseFloat(witnesscharges.toFixed(2)),
        subtotal2: parseFloat(subtotal2.toFixed(2)),
        cgstamount,
        sgstamount,
        igstamount,
        total,
        isSgst,
    };
}

export default function AddProformaInvoiceItemTesting() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [savingItems, setSavingItems] = useState(false);
    const [addingItem, setAddingItem] = useState(false);

    const [items, setItems] = useState([]);
    const instnoRef = useRef(0);

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");

    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState("");
    const [loadingPackages, setLoadingPackages] = useState(false);

    const [charges, setCharges] = useState({
        discnumber: 0,
        disctype: "%",
        freight: 0,
        mobilisation: 0,
        witnessnumber: 0,
        witnesstype: "amount",
        samplehandling: 0,
        sampleprep: 0,
        cgstper: 9,
        sgstper: 9,
        igstper: 18,
        statecode: "",
    });

    const setCharge = (k, v) => setCharges((p) => ({ ...p, [k]: v }));

    useEffect(() => {
        const load = async () => {
            if (!id) {
                toast.error("Invalid invoice ID");
                navigate("/dashboards/accounts/proforma-invoice");
                return;
            }
            try {
                const [invRes, prodRes] = await Promise.all([
                    axios.get(`/accounts/get-proforma-invoicebyid/${id}`),
                    axios.get("/testing/get-prodcut-list"),
                ]);

                const d = invRes.data?.data ?? {};

                setCharges({
                    discnumber: d.discnumber ?? 0,
                    disctype: d.disctype ?? "%",
                    freight: d.freight ?? 0,
                    mobilisation: d.mobilisation ?? 0,
                    witnessnumber: d.witnessnumber ?? 0,
                    witnesstype: d.witnesstype ?? "amount",
                    samplehandling: d.samplehandling ?? 0,
                    sampleprep: d.sampleprep ?? 0,
                    cgstper: d.cgstper || 9,
                    sgstper: d.sgstper || 9,
                    igstper: d.igstper || 18,
                    statecode: String(d.statecode ?? ""),
                });

                if (d.items) {
                    setItems(d.items.filter(i => i.typeofinvoice === "Testing" || !i.typeofinvoice).map((i, idx) => ({ ...i, _key: `edit-${idx}` })));
                }

                setProducts(prodRes.data?.data ?? prodRes.data ?? []);
            } catch (err) {
                console.error("Error loading data:", err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    useEffect(() => {
        if (!selectedProduct) {
            setPackages([]);
            setSelectedPackage("");
            return;
        }
        const loadPackages = async () => {
            setLoadingPackages(true);
            try {
                // Using type=2 for testing, matching generic logic
                const res = await axios.get(`/testing/get-package-list?pid=${selectedProduct}&type=2`);
                setPackages(res.data?.data ?? res.data ?? []);
            } catch {
                toast.error("Failed to fetch packages");
                setPackages([]);
            } finally {
                setLoadingPackages(false);
            }
        };
        loadPackages();
    }, [selectedProduct]);

    const handleAddTestingItem = async () => {
        if (!selectedProduct) {
            toast.error("Please select a product");
            return;
        }
        if (!selectedPackage) {
            toast.error("Please select a package");
            return;
        }
        setAddingItem(true);
        try {
            const res = await axios.get(
                `/accounts/get-directinvoice-testing-item?package=${selectedPackage}`
            );

            const d = res.data?.data ?? res.data ?? {};
            const hiddenFields = d.hidden_fields ?? {};
            const itemData = d.item ?? {};

            const productName = products.find((p) => String(p.id) === String(selectedProduct))?.name ?? "";
            const pkg = packages.find((p) => String(p.id) === String(selectedPackage));
            const packageName = pkg?.package ?? pkg?.name ?? "";

            const name = hiddenFields.itemname ?? d.name ?? productName;
            const desc = hiddenFields.itempackagedesc ?? d.package_description ?? d.description ?? packageName;

            const rate = parseFloat(itemData.rate ?? d.rate ?? 0) || 0;

            const k = items.length;

            const newItem = {
                _key: `test-${instnoRef.current}-${k}-${Math.random()}`,
                name: name,
                instid: hiddenFields.itempricematrixid ?? (Number(selectedPackage) || 0),
                accreditation: d.accreditation || CATEGORY_MAP[Number(pkg?.category)] || "General",
                description: desc,
                qty: itemData.qty ?? 1,
                rate: rate,
                amount: rate * (itemData.qty ?? 1),
                quoteitemid: 0,
            };

            setItems((prev) => [...prev, newItem]);
            instnoRef.current += 1;
            setSelectedPackage("");
        } catch {
            toast.error("Failed to load testing item details");
        } finally {
            setAddingItem(false);
        }
    };

    const handleItemChange = (key, field, val) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item._key !== key) return item;
                const updated = { ...item, [field]: val };
                if (field === "qty" || field === "rate") {
                    updated.amount = (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0);
                }
                return updated;
            }),
        );
    };

    const handleDeleteItem = (key) => setItems((prev) => prev.filter((i) => i._key !== key));

    const totals = calcTotals(items, charges);

    const handleSaveItems = async () => {
        setSavingItems(true);
        try {
            const payload = {
                invoiceid: Number(id),
                subtotal: totals.subtotal,
                discnumber: parseFloat(charges.discnumber) || 0,
                disctype: charges.disctype,
                discount: totals.discount,
                subtotal2: totals.subtotal2,
                freight: parseFloat(charges.freight) || 0,
                mobilisation: parseFloat(charges.mobilisation) || 0,
                witnesscharges: totals.witnesscharges,
                witnesstype: charges.witnesstype,
                witnessnumber: parseFloat(charges.witnessnumber) || 0,
                samplehandling: parseFloat(charges.samplehandling) || 0,
                sampleprep: parseFloat(charges.sampleprep) || 0,
                cgstper: totals.isSgst ? parseFloat(charges.cgstper) || 0 : 0,
                cgstamount: totals.cgstamount,
                sgstper: totals.isSgst ? parseFloat(charges.sgstper) || 0 : 0,
                sgstamount: totals.sgstamount,
                igstper: !totals.isSgst ? parseFloat(charges.igstper) || 0 : 0,
                igstamount: totals.igstamount,
                totalamount: totals.total,
                name: items.map((i) => i.name),
                instid: items.map((i) => i.instid ?? 0),
                accreditation: items.map((i) => i.accreditation ?? ""),
                description: items.map((i) => i.description ?? ""),
                qty: items.map((i) => i.qty),
                rate: items.map((i) => i.rate),
                amount: items.map((i) => i.amount),
                quoteitemid: items.map((i) => i.quoteitemid ?? 0),
            };

            const res = await axios.post("/accounts/add-proforma-item", payload);
            if (res.data.success === true || res.data.status === true || res.data.status === "true") {
                toast.success("Invoice Items saved ✅");
                navigate("/dashboards/accounts/proforma-invoice");
            } else {
                toast.error(res.data.message ?? "Failed to save items");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        } finally {
            setSavingItems(false);
        }
    };

    if (loading) {
        return (
            <Page title="Add Proforma Invoice Items">
                <Spinner />
            </Page>
        );
    }

    const productOptions = products.map(p => ({ value: p.id, label: `${p.name} ${p.description ? `(${p.description})` : ''}` }));
    const packageOptions = packages.map(p => ({ value: p.id, label: p.package ?? p.name }));

    return (
        <Page title="Add Proforma Invoice Items">
            <div className="transition-content px-[var(--margin-x)] pb-8">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
                        Add Proforma Invoice Items (Testing)
                    </h2>
                    <button
                        onClick={() => navigate("/dashboards/accounts/proforma-invoice")}
                        className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        ← Back to Proforma Invoice List
                    </button>
                </div>

                <Card className="p-6">
                    <div className="dark:border-dark-600 dark:bg-dark-700 mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[220px] flex-1">
                                <label className={labelCls}>Select Product</label>
                                <Select
                                    options={productOptions}
                                    value={productOptions.find(o => o.value == selectedProduct) || null}
                                    onChange={(selected) => setSelectedProduct(selected ? selected.value : "")}
                                    placeholder="Select Product"
                                    isClearable
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            borderColor: '#d1d5db',
                                            '&:hover': { borderColor: '#3b82f6' },
                                            boxShadow: 'none',
                                            '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' }
                                        }),
                                        menu: (provided) => ({
                                            ...provided,
                                            zIndex: 9999
                                        })
                                    }}
                                />
                            </div>
                            <div className="min-w-[220px] flex-1">
                                <label className={labelCls}>Select Package {loadingPackages && <span className="text-xs text-blue-500">(Loading...)</span>}</label>
                                <Select
                                    options={packageOptions}
                                    value={packageOptions.find(o => o.value == selectedPackage) || null}
                                    onChange={(selected) => setSelectedPackage(selected ? selected.value : "")}
                                    placeholder="Select Package"
                                    isClearable
                                    isDisabled={!selectedProduct || loadingPackages}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            borderColor: '#d1d5db',
                                            '&:hover': { borderColor: '#3b82f6' },
                                            boxShadow: 'none',
                                            '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' }
                                        }),
                                        menu: (provided) => ({
                                            ...provided,
                                            zIndex: 9999
                                        })
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleAddTestingItem}
                                disabled={addingItem || !selectedProduct || !selectedPackage}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {addingItem ? "Adding…" : "+ Add Item"}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="dark:bg-dark-700 bg-gray-100">
                                    {["Name", "Accreditation", "Description", "Qty", "Rate", "Amount", ""].map((h) => (
                                        <th key={h} className="dark:text-dark-300 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="dark:divide-dark-600 divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="dark:text-dark-500 py-8 text-center text-sm text-gray-400">
                                            No items added yet
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item._key} className="dark:hover:bg-dark-700 hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(item._key, "name", e.target.value)}
                                                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.accreditation}
                                                    onChange={(e) => handleItemChange(item._key, "accreditation", e.target.value)}
                                                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <textarea
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item._key, "description", e.target.value)}
                                                    rows={2}
                                                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full resize-y min-h-[40px] rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(item._key, "qty", e.target.value)}
                                                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-16 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                                    min={1}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(item._key, "rate", e.target.value)}
                                                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                                />
                                            </td>
                                            <td className="dark:text-dark-200 px-3 py-2 font-mono text-sm font-semibold text-gray-700">
                                                {parseFloat(item.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2">
                                                <button onClick={() => handleDeleteItem(item._key)} className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600">
                                                    X
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="dark:border-dark-600 mt-6 border-t border-gray-200 pt-5">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="dark:text-dark-400 text-sm text-gray-600">Subtotal</span>
                                    <span className="font-mono text-sm font-semibold">{totals.subtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">Discount</span>
                                    <input
                                        type="number"
                                        value={charges.discnumber}
                                        onChange={(e) => setCharge("discnumber", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    />
                                    <select
                                        value={charges.disctype}
                                        onChange={(e) => setCharge("disctype", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    >
                                        <option value="%">%</option>
                                        <option value="Flat">Flat</option>
                                    </select>
                                    <span className="ml-auto font-mono text-sm">{totals.discount.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">Mobilisation &amp; Demobilisation</span>
                                    <input
                                        type="number"
                                        value={charges.mobilisation}
                                        onChange={(e) => setCharge("mobilisation", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    />
                                    <span className="ml-auto font-mono text-sm">{parseFloat(charges.mobilisation || 0).toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">Freight Charges</span>
                                    <input
                                        type="number"
                                        value={charges.freight}
                                        onChange={(e) => setCharge("freight", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    />
                                    <span className="ml-auto font-mono text-sm">{parseFloat(charges.freight || 0).toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">Witness Charges</span>
                                    <input
                                        type="number"
                                        value={charges.witnessnumber}
                                        onChange={(e) => setCharge("witnessnumber", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    />
                                    <select
                                        value={charges.witnesstype}
                                        onChange={(e) => setCharge("witnesstype", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    >
                                        <option value="%">%</option>
                                        <option value="amount">Flat</option>
                                    </select>
                                    <span className="ml-auto font-mono text-sm">{totals.witnesscharges.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">Sample Handling</span>
                                    <input
                                        type="number"
                                        value={charges.samplehandling}
                                        onChange={(e) => setCharge("samplehandling", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    />
                                    <span className="ml-auto font-mono text-sm">{parseFloat(charges.samplehandling || 0).toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">Sample Prep Charges</span>
                                    <input
                                        type="number"
                                        value={charges.sampleprep}
                                        onChange={(e) => setCharge("sampleprep", e.target.value)}
                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                    />
                                    <span className="ml-auto font-mono text-sm">{parseFloat(charges.sampleprep || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="dark:border-dark-600 w-full border-t border-gray-200 pt-4 lg:w-72 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="dark:text-dark-400 text-gray-600">Subtotal 2</span>
                                        <span className="font-mono font-semibold">{totals.subtotal2.toFixed(2)}</span>
                                    </div>
                                    {totals.isSgst ? (
                                        <>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="dark:text-dark-400 text-gray-600">Cgst</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={charges.cgstper}
                                                        onChange={(e) => setCharge("cgstper", e.target.value)}
                                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-12 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                                                    />
                                                    <span className="text-xs text-gray-500">%</span>
                                                    <span className="ml-2 w-20 text-right font-mono">{totals.cgstamount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="dark:text-dark-400 text-gray-600">Sgst</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={charges.sgstper}
                                                        onChange={(e) => setCharge("sgstper", e.target.value)}
                                                        className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-12 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                                                    />
                                                    <span className="text-xs text-gray-500">%</span>
                                                    <span className="ml-2 w-20 text-right font-mono">{totals.sgstamount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="dark:text-dark-400 text-gray-600">IGST</span>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={charges.igstper}
                                                    onChange={(e) => setCharge("igstper", e.target.value)}
                                                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-12 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                                                />
                                                <span className="text-xs text-gray-500">%</span>
                                                <span className="ml-2 w-20 text-right font-mono">{totals.igstamount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="dark:border-dark-500 flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                                        <span className="dark:text-dark-100 text-gray-800">Total</span>
                                        <span className="font-mono text-green-700 dark:text-green-400">{totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSaveItems}
                            disabled={savingItems}
                            className="rounded-md bg-green-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {savingItems ? "Saving…" : "Add Proforma invoice Items"}
                        </button>
                    </div>
                </Card>
            </div>
        </Page>
    );
}
