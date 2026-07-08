export default function ReturnTRFInst({ trfItems, setTrfItems, register }) {
    
    const handleRemove = (itemId) => {
        setTrfItems(prev => prev.filter(item => item.id !== itemId));
    };

    if (!trfItems || trfItems.length === 0) return null;

    return (
        <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100">TRF Instrument Details</h4>
            
            <div className="hidden md:grid grid-cols-12 gap-4 mb-2 bg-gray-50 dark:bg-dark-800 p-3 rounded-lg font-bold text-gray-700 dark:text-dark-200 text-sm">
                <div className="col-span-3">Name of item</div>
                <div className="col-span-3">Description of item in courier</div>
                <div className="col-span-2">Items Attached</div>
                <div className="col-span-3">Remark</div>
                <div className="col-span-1"></div>
            </div>

            <div className="space-y-4">
                {trfItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-200 dark:border-dark-500 pb-4">
                        <div className="col-span-3">
                            <span className="font-medium text-gray-800 dark:text-dark-100">{item.productName || item.name}</span>
                            <input type="hidden" {...register(`itemid[]`)} value={item.id} />
                        </div>

                        <div className="col-span-3">
                            <textarea 
                                {...register(`description_${item.id}`)}
                                className="w-full rounded border border-gray-300 dark:border-dark-500 p-2 text-sm bg-white dark:bg-dark-700 dark:text-dark-100"
                                rows="2"
                            ></textarea>
                        </div>

                        <div className="col-span-2 space-y-2">
                            {item.receivedItems && item.receivedItems.map(rec => (
                                <div key={rec.id} className="flex flex-col gap-1">
                                    <input type="hidden" value={rec.id} {...register(`qid${item.id}[]`)} />
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-200">
                                        <input 
                                            type="checkbox"
                                            value={rec.id}
                                            {...register(`instrument${item.id}[]`)}
                                            className="h-4 w-4 rounded border-gray-300"
                                            onChange={(e) => {
                                                // Handle showing the quantity input
                                                const el = document.getElementById(`reminent${rec.id}quantity${item.id}`);
                                                if(el) el.style.display = e.target.checked ? 'block' : 'none';
                                            }}
                                        />
                                        {rec.name}
                                    </label>
                                    <input 
                                        type="number" 
                                        id={`reminent${rec.id}quantity${item.id}`}
                                        {...register(`reminent${rec.id}quantity${item.id}`, {
                                            min: 1,
                                            max: rec.remainingqtytoreceive
                                        })}
                                        className="mt-1 w-full rounded border border-gray-300 dark:border-dark-500 p-1 text-sm bg-white dark:bg-dark-700"
                                        placeholder={`Qty (Max: ${rec.remainingqtytoreceive})`}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ))}

                            {item.certificate !== "Yes" && (
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-200">
                                    <input type="checkbox" value="Yes" {...register(`certificate${item.id}`)} className="h-4 w-4 rounded border-gray-300" /> Report
                                </label>
                            )}

                            {item.invoice !== "Yes" && (
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-200">
                                    <input type="checkbox" value="Yes" {...register(`invoice${item.id}`)} className="h-4 w-4 rounded border-gray-300" /> Invoice
                                </label>
                            )}
                        </div>

                        <div className="col-span-3">
                            {/* Remark placeholder */}
                        </div>

                        <div className="col-span-1 text-right">
                            <button 
                                type="button" 
                                className="px-3 py-1 bg-red-50 text-red-500 border border-red-200 rounded hover:bg-red-100 font-bold dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                onClick={() => handleRemove(item.id)}
                            >
                                X
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
