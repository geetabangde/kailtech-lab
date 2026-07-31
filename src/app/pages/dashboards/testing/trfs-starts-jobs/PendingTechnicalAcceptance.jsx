import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "utils/axios";
import Select from "react-select";
import { Page } from "components/shared/Page";
import { Input } from "components/ui";

// ── Permissions ───────────────────────────────────────────────────────────────
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PendingTechnicalAcceptance() {
  const permissions = usePermissions();

  // PHP: if(!in_array(126, $permissions)) → redirect
  const canAccess = permissions.includes(126);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);

  // Filters — PHP: ctype (perm 389), specificpurpose (perm 390)
  const [ctype, setCtype] = useState("");
  const [specificpurpose, setSpecificpurpose] = useState("");
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState({});

  const handleColumnFilterChange = (col, val) => {
    setColumnFilters((prev) => ({ ...prev, [col]: val }));
  };

  // ── Fetch dropdown options ────────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      // Customer Types — permission 389
      if (permissions.includes(389)) {
        try {
          const res = await axios.get("/people/get-customer-type-list");
          const d = res.data?.Data ?? res.data?.data ?? res.data ?? [];
          setCustomerTypes(Array.isArray(d) ? d : []);
        } catch { setCustomerTypes([]); }
      }

      // Specific Purposes — permission 390
      if (permissions.includes(390)) {
        try {
          const res = await axios.get("/people/get-specific-purpose-list");
          const d = res.data?.data ?? res.data?.Data ?? res.data ?? [];
          setSpecificPurposes(Array.isArray(d) ? d : []);
        } catch { setSpecificPurposes([]); }
      }
    };
    fetchDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch list — PHP: trfProducts.status=2 ───────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", 2); // PHP: trfProducts.status=2
      if (ctype) params.append("ctype", ctype);
      if (specificpurpose) params.append("specificpurpose", specificpurpose);

      const res = await axios.get(
        `/actionitem/get-pending-technical-acceptance?${params.toString()}`
      );
      const list = res.data?.data ?? res.data?.trf_products ?? res.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [ctype, specificpurpose]);

  useEffect(() => { if (canAccess) fetchData(); }, [fetchData, canAccess]);

  // ── Client-side search ────────────────────────────────────────────────────
  const filtered = data.filter((row) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (![
        row.product, row.product_name, row.package, row.package_name, String(row.trf), row.lrn,
        row.grade_size, row.customer_type, row.specific_purpose,
      ].some((v) => v?.toLowerCase().includes(q))) {
        return false;
      }
    }

    for (const [col, val] of Object.entries(columnFilters)) {
      if (!val) continue;
      const q = val.toLowerCase();
      let cellValue = "";
      if (col === "Product") cellValue = row.product ?? row.product_name ?? "";
      if (col === "Package") cellValue = row.package ?? row.package_name ?? "";
      if (col === "TRF No") cellValue = String(row.trf ?? "");
      if (col === "LRN") cellValue = row.lrn ?? "";
      if (col === "Grade/Size") cellValue = row.grade_size ?? (row.grade && row.size ? `${row.grade}/${row.size}` : "NA/NA");
      if (col === "Customer Type") cellValue = row.customer_type ?? customerTypes.find((c) => c.id === row.ctype)?.name ?? "";
      if (col === "Specific Purpose") cellValue = row.specific_purpose ?? specificPurposes.find((s) => s.id === row.specificpurpose)?.name ?? "";

      if (!cellValue.toLowerCase().includes(q)) return false;
    }

    return true;
  });

  // ── No access ─────────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <Page title="Pending Technical Acceptance">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 126 required
          </p>
        </div>
      </Page>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Pending Technical Acceptance">
        <div className="flex h-60 items-center justify-center gap-3 text-sm text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "32px",
      minWidth: "150px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <Page title="Pending Technical Acceptance">
      <div className="transition-content w-full pb-8">

        {/* ── Title ── */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Pending Technical Acceptance
          </h2>
        </div>

        {/* ── Filters — PHP: ctype (389), specificpurpose (390) ── */}
        {(permissions.includes(389) || permissions.includes(390)) && (
          <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            {permissions.includes(389) && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Customer Type
                </label>
                <Select
                  value={customerTypes.find(ct => ct.id === ctype) ? { value: ctype, label: customerTypes.find(ct => ct.id === ctype).name } : null}
                  onChange={(selectedOption) => setCtype(selectedOption ? selectedOption.value : "")}
                  options={customerTypes.map(ct => ({ value: ct.id, label: ct.name }))}
                  placeholder="Select Customer Type"
                  isClearable
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            )}

            {permissions.includes(390) && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Specific Purpose
                </label>
                <Select
                  value={specificPurposes.find(sp => sp.id === specificpurpose) ? { value: specificpurpose, label: specificPurposes.find(sp => sp.id === specificpurpose).name } : null}
                  onChange={(selectedOption) => setSpecificpurpose(selectedOption ? selectedOption.value : "")}
                  options={specificPurposes.map(sp => ({ value: sp.id, label: sp.name }))}
                  placeholder="Select Specific Purpose"
                  isClearable
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            )}

            <button
              onClick={() => { setCtype(""); setSpecificpurpose(""); }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Table Card ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

          {/* Search */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{filtered.length}</span> entries
            </p>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] [&_td]:whitespace-normal [&_td]:break-words">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  {[
                    "S.No.", "Product", "Package", "TRF No", "LRN",
                    "Grade/Size",
                    ...(permissions.includes(389) ? ["Customer Type"] : []),
                    ...(permissions.includes(390) ? ["Specific Purpose"] : []),
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-1 py-1 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
                <tr className="dark:bg-dark-800/50 bg-gray-50">
                  {[
                    "S.No.", "Product", "Package", "TRF No", "LRN",
                    "Grade/Size",
                    ...(permissions.includes(389) ? ["Customer Type"] : []),
                    ...(permissions.includes(390) ? ["Specific Purpose"] : []),
                    "Action",
                  ].map((h) => (
                    <th
                      key={h + "-filter"}
                      className="border-t border-gray-300 dark:border-dark-600 px-2 py-1.5"
                    >
                      {["Product", "Package", "TRF No", "LRN", "Grade/Size", "Customer Type", "Specific Purpose"].includes(h) ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Input
                            size="sm"
                            placeholder={`Search...`}
                            value={columnFilters[h] || ""}
                            onChange={(e) => handleColumnFilterChange(h, e.target.value)}
                            classNames={{
                              input:
                                "ring-primary-500/30 dark:bg-dark-900 dark:border-dark-700 h-7 border-gray-300 px-2 py-1 text-[10px] focus:ring-1",
                            }}
                          />
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6 + (permissions.includes(389) ? 1 : 0) + (permissions.includes(390) ? 1 : 0) + 1}
                      className="py-12 text-center text-sm text-gray-400 dark:text-gray-600"
                    >
                      No pending technical acceptance items found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-1 py-1 text-gray-500 dark:text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-1 py-1 font-medium text-gray-800 dark:text-gray-200">
                        {row.product ?? row.product_name ?? "—"}
                      </td>
                      <td className="px-1 py-1 text-gray-600 dark:text-gray-400">
                        {row.package ?? row.package_name ?? "—"}
                      </td>
                      <td className="px-1 py-1 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {row.trf ?? "—"}
                      </td>
                      <td className="px-1 py-1 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {row.lrn || "—"}
                      </td>
                      <td className="px-1 py-1 text-gray-600 dark:text-gray-400">
                        {row.grade_size ?? (row.grade && row.size ? `${row.grade}/${row.size}` : "NA/NA")}
                      </td>

                      {/* Customer Type — permission 389 */}
                      {permissions.includes(389) && (
                        <td className="px-1 py-1 text-gray-600 dark:text-gray-400">
                          {row.customer_type ??
                            customerTypes.find((c) => c.id === row.ctype)?.name ??
                            "—"}
                        </td>
                      )}

                      {/* Specific Purpose — permission 390 */}
                      {permissions.includes(390) && (
                        <td className="px-1 py-1 text-gray-600 dark:text-gray-400">
                          {row.specific_purpose ??
                            specificPurposes.find((s) => s.id === row.specificpurpose)?.name ??
                            "—"}
                        </td>
                      )}

                      {/* Action — PHP: in_array(126, $permissions) */}
                      <td className="px-1 py-1">
                        {row.status === 2 && permissions.includes(126) ? (
                          <Link
                            to={`/dashboards/testing/trfs-starts-jobs/technical-acceptance/${row.id}`}
                            className="inline-block rounded bg-blue-600 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-blue-700 text-center leading-tight"
                          >
                            <>Technical <br /> Acceptance</>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">No Action Required</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Page>
  );
}