// Custom multi-word search filter
export const fuzzyFilter = (row, columnId, value, addMeta) => {
    // Combine all cell values into a single lowercase string for cross-column searching
    const rowText = row.getAllCells().map(cell => {
        const v = cell.getValue();
        return v == null ? "" : String(v).toLowerCase();
    }).join(" ");

    // Split the search query into individual lowercase words
    const queryWords = String(value).toLowerCase().split(/\s+/).filter(Boolean);

    // The row matches if EVERY word in the search query is found anywhere in the row
    const passed = queryWords.every(word => rowText.includes(word));

    addMeta({
        itemRank: { passed }
    });

    return passed;
};
