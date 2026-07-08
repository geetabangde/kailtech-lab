export default function ReturnInsta({ issueItems, register }) {
    if (!issueItems || issueItems.length === 0) return null;

    // Total master id is the total number of items
    const totalid = issueItems.length;

    return (
        <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100">Master Calibration Instrument Details</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-500">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
                    <thead className="bg-gray-50 dark:bg-dark-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">ID Number</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Name Of The Item And Spares</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Issued To</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Return To:</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-dark-200">Remark</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-500 dark:bg-dark-700">
                        {issueItems.map((item, index) => {
                            // Render Checklist Error Row if checklist_not_filled is true
                            if (item.checklist_not_filled) {
                                return (
                                    <tr key={item.id || index} className="item-chklist">
                                        <td colSpan="6" className="px-4 py-3 text-sm text-red-500 font-medium">
                                            {item.checklist_error_msg || `${item.name} ${item.idno} Return Check List Not Filled`}
                                        </td>
                                    </tr>
                                );
                            }

                            // Regular Row
                            return (
                                <tr key={item.id} className="item-issue">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.idno}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <select 
                                            className="w-full rounded border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-700 p-2 text-sm"
                                            {...register(`issuedto[]`)}
                                        >
                                            <option value="">Select</option>
                                            {/* Note: The PHP had a single option for the specific admin user who was issued the item */}
                                            <option value={item.id}>{item.issuedtoname}</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <select 
                                            className="w-full rounded border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-700 p-2 text-sm"
                                            {...register(`returnlocation[]`)}
                                        >
                                            <option value="">choose one..</option>
                                            {item.return_locations && item.return_locations.length > 0 ? (
                                                item.return_locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))
                                            ) : (
                                                <option value="24">Store</option>
                                            )}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className="locqty">
                                            <input 
                                                type="text" 
                                                className="w-full rounded border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-700 p-2 text-sm"
                                                {...register(`qty[]`)}
                                                defaultValue={item.qty || ""}
                                                placeholder="Qty"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-dark-100">{item.remark}</td>
                                    
                                    {/* Hidden fields just like PHP logic */}
                                    <td className="hidden">
                                        <input type="hidden" {...register(`instissuetype[]`)} value={item.instissuetype} />
                                        <input type="hidden" {...register(`itemid[]`)} value={item.instrumentid} />
                                        <input type="hidden" {...register(`issueid[]`)} value={item.id} />
                                        
                                        {/* Added a hidden checkbox so the "Please select at least one instrument" validation passes if this row exists */}
                                        <input type="checkbox" defaultChecked className="hidden" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {/* Hidden totalmasterid needed for checklist validation logic in onSubmit */}
                <input type="hidden" id="totalmasterid" value={totalid} />
            </div>
        </div>
    );
}
