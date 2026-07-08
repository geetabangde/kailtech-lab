export default function ReturnInwardInst({ inwardItems, setInwardItems, register, setValue, watch }) {
    
    const handleRemove = (itemId) => {
        setInwardItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setValue("ids", inwardItems.map(item => String(item.id)));
        } else {
            setValue("ids", []);
        }
    };

    if (!inwardItems || inwardItems.length === 0) return null;

    const selectedIds = watch("ids") || [];
    const isAllSelected = inwardItems.length > 0 && selectedIds.length === inwardItems.length;

    return (
        <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100">Inward Instrument Details</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-500">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
                    <thead className="bg-gray-50 dark:bg-dark-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Sr no</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 rounded border-gray-300"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">REf No</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Id no</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Serial no</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Remark</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Close</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-500 dark:bg-dark-700">
                        {inwardItems.map((item, index) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{index + 1}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <input 
                                        type="checkbox" 
                                        value={item.id}
                                        {...register(`ids`)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">
                                    BRN: <br/>
                                    LRN: {item.lrn}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.name}</td>
                                <td className="px-4 py-3 whitespace-pre-wrap text-sm text-gray-800 dark:text-dark-100" style={{ width: '120px', wordWrap: 'break-word' }}>{item.idno || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.serialno || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.description}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.remark}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <button 
                                        type="button" 
                                        className="px-3 py-1 bg-red-50 text-red-500 border border-red-200 rounded hover:bg-red-100 font-bold dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                        onClick={() => handleRemove(item.id)}
                                    >
                                        X
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
