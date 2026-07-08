import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import toast, { Toaster } from 'react-hot-toast';
import dayjs from 'dayjs';
import { Page } from "components/shared/Page";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import { ChevronsLeft, Search } from "lucide-react";
import { FormatHeader } from "components/shared/FormatHeader";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { PaginationSection } from "components/shared/table/PaginationSection";

export default function ConsumableLogCrmWise() {
    const navigate = useNavigate();
    const { id } = useParams(); // hakuna/crmid
    const [searchParams] = useSearchParams();
    const labid = searchParams.get('matata') || '';
    const batchno = searchParams.get('batchno') || '';

    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
    // Permission 356 matches CRM list view.
    const hasPermission = permissions.includes(356);

    const [logData, setLogData] = useState([]);
    const [headerInfo, setHeaderInfo] = useState(null);
    const [instrumentName, setInstrumentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([{ id: "date", desc: true }]);

    const handleBackToList = () => {
        navigate(-1);
    };

    useEffect(() => {
        if (!hasPermission) {
            setLoading(false);
            return;
        }

        if (id) {
            fetchLogData();
        } else {
            setLoading(false);
        }
    }, [id, labid, batchno, hasPermission]);

    const fetchLogData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/register/crm-wise-log', {
                params: {
                    crmid: id,
                    departmentid: labid,
                    batchno: batchno,
                }
            });

            console.log('✅ Consumable Log loaded:', response.data);

            const header = response.data?.header || {};
            const entries = response.data?.data || [];

            setHeaderInfo(header);
            setInstrumentName(header.item_name || 'Unknown CRM');
            setLogData(entries);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch log data';
            toast.error(errorMessage);
            console.error('❌ Error fetching log data:', err);
        } finally {
            setLoading(false);
        }
    };

    const roundVal = (val) => {
        if (val === undefined || val === null || val === '') return '0';
        const num = parseFloat(val);
        return isNaN(num) ? '0' : num.toFixed(2);
    };

    const columns = useMemo(
        () => [
            {
                id: "sno",
                header: "Sr. No",
                cell: (info) => info.row.index + 1,
            },
            {
                accessorKey: "date",
                header: "Date",
                cell: (info) => {
                    const val = info.getValue();
                    if (!val) return "-";
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
                        return val;
                    }
                    const d = dayjs(val);
                    return d.isValid() ? d.format("DD/MM/YYYY") : val;
                },
            },
            {
                accessorKey: "opening_stock",
                header: "Opening Stock",
                cell: (info) => {
                    const val = info.getValue();
                    const unit = info.row.original.unit || '';
                    return `${roundVal(val)} ${unit}`;
                },
            },
            {
                accessorKey: "inward",
                header: "Inward",
                cell: (info) => {
                    const val = info.getValue();
                    const unit = info.row.original.unit || '';
                    return `${roundVal(val)} ${unit}`;
                },
            },
            {
                accessorKey: "quantity_used",
                header: "Quantity used",
                cell: (info) => {
                    const val = info.getValue();
                    const unit = info.row.original.unit || '';
                    return `${roundVal(val)} ${unit}`;
                },
            },
            {
                accessorKey: "balance_quantity",
                header: "Balance quantity",
                cell: (info) => {
                    const val = info.getValue();
                    const unit = info.row.original.unit || '';
                    return `${roundVal(val)} ${unit}`;
                },
            },
            {
                accessorKey: "person",
                header: "Person",
                cell: (info) => info.getValue() || "-",
            },
            {
                accessorKey: "remark",
                header: "Remark",
                cell: (info) => info.getValue() || "-",
            },
        ],
        []
    );

    const table = useReactTable({
        data: logData,
        columns,
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (!hasPermission) {
        return (
            <Page title="Consumables Log">
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center max-w-md mx-auto p-6">
                    <div className="text-red-500 text-5xl">⚠️</div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-dark-100">Permission Denied</h3>
                    <p className="text-gray-600 dark:text-dark-300">
                        You do not have permission to view this page.
                    </p>
                    <Button
                        onClick={handleBackToList}
                        variant="filled"
                        color="neutral"
                        className="flex items-center gap-1.5"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </Page>
        );
    }

    if (loading) {
        return (
            <Page title="Consumables Log">
                <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
                    <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                    </svg>
                    Loading consumables log...
                </div>
            </Page>
        );
    }

    return (
        <Page title="Consumables Log">
            <Toaster position="top-right" />
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-[var(--margin-x)] pt-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-wide text-gray-800 dark:text-dark-50">
                        Consumables Log
                    </h2>
                    {instrumentName && (
                        <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">
                            {instrumentName}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleBackToList}
                        variant="filled"
                        color="neutral"
                        className="flex items-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="px-[var(--margin-x)] pb-5">
                <Card className="flex grow flex-col bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-500 rounded-lg p-6 shadow-sm">
                    <div className="p-4 pb-0 bg-white dark:bg-dark-900">
                        <FormatHeader
                            title="Consumption Record"
                            qfNo="KTRCQF/0604/20"
                            issueNo="01"
                            issueDate="01/06/2019"
                            revisionNo="01"
                            revisionDate="20/08/2021"
                        />

                        {headerInfo && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 p-4 rounded-lg bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700">
                                <div>
                                    <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Item ID</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-dark-100">{headerInfo.item_id || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Item Name</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-dark-100">{headerInfo.item_name || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Batch Number</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-dark-100">{headerInfo.batch_no || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Current Stock</span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-dark-100">
                                        {headerInfo.current_stock !== undefined ? `${roundVal(headerInfo.current_stock)} ${logData[0]?.unit || 'g'}` : '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search bar */}
                    <div className="flex justify-between items-center mb-4 mt-4">
                        <div className="relative w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                                <Search className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                value={globalFilter ?? ""}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                placeholder="Search date, remark..."
                                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-dark-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs dark:bg-dark-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-wrapper min-w-full grow overflow-x-auto">
                        <Table hoverable className="w-full text-left rtl:text-right text-xs">
                            <THead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <Th
                                                key={header.id}
                                                className="bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 p-3"
                                            >
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </Th>
                                        ))}
                                    </Tr>
                                ))}
                            </THead>
                            <TBody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                        <Tr
                                            key={row.id}
                                            className="border-b border-gray-200 dark:border-b-dark-500"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <Td key={cell.id} className="p-3 bg-white dark:bg-dark-900">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Td>
                                            ))}
                                        </Tr>
                                    ))
                                ) : (
                                    <Tr>
                                        <Td colSpan={columns.length} className="py-10 text-center text-gray-500 bg-white dark:bg-dark-900">
                                            No log entries found
                                        </Td>
                                    </Tr>
                                )}
                            </TBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {table.getFilteredRowModel().rows.length > 0 && (
                        <div className="pt-4">
                            <PaginationSection table={table} />
                        </div>
                    )}
                </Card>
            </div>
        </Page>
    );
}
