// Import Dependencies

export function Toolbar({ filters, onChange, onSearch, onExport }) {
  const handleInput = (name, value) => {
    onChange(name, value);
  };

  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Environmental Record
        </h2>
      </div>

      {/* Form matching PHP structure */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="row"
      >
        <div className="col-sm-4">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Date of receipt of complaint
          </label>
          <input
            type="text"
            name="searchdate"
            value={filters.searchdate || ""}
            onChange={(e) => handleInput("searchdate", e.target.value)}
            className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            placeholder="Search Date of receipt of complaint"
          />
        </div>
        <div className="col-sm-4">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Rca Done on
          </label>
          <input
            type="text"
            name="rca_done_on"
            value={filters.rca_done_on || ""}
            onChange={(e) => handleInput("rca_done_on", e.target.value)}
            className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            placeholder="Search Rca Done on"
          />
        </div>
        <div className="col-sm-4">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Alloted user
          </label>
          <input
            type="text"
            name="alloted_user"
            value={filters.alloted_user || ""}
            onChange={(e) => handleInput("alloted_user", e.target.value)}
            className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            placeholder="Search Alloted user"
          />
        </div>
        <div className="col-sm-4">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Alloted Masters
          </label>
          <input
            type="text"
            name="alloted_masters"
            value={filters.alloted_masters || ""}
            onChange={(e) => handleInput("alloted_masters", e.target.value)}
            className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            placeholder="Search Alloted Masters"
          />
        </div>
        <div className="col-sm-2">
          <button type="submit" className="btn btn-outline-primary">
            Search
          </button>
          <button type="button" onClick={onExport} className="btn btn-outline-primary">
            Export
          </button>
        </div>
      </form>
    </div>
  );
}
