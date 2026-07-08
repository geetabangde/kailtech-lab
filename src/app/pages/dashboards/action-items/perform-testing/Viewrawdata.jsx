// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// =============================================================================
// ViewRawData Page
// PHP: viewrawdatasingle.php?hakuna={teid}
// Route: /dashboards/action-items/perform-testing/view-raw-data/:teid
//
// API: GET /actionitem/view-test-rawdata?testeventdata_id={teid}
//
// Confirmed response structure:
// {
//   status: true,
//   testevent_id: "483133",
//   lrn: "25051164221",
//   parameter: { id, name, cycle, formula },
//   environment: { startdate, enddate, temperature, humidity, remark },
//   headers: ["Visual ", ...],          ← PHP: measurements.name per parameterelements
//   data: [                             ← PHP: for ($i=0; $i<$cycle; $i++)
//     [                                 ← cycle row i
//       { measurement_id, value, unit } ← PHP: testdata.value WHERE cycle=$i
//     ]
//   ],
//   attachment: null | url
// }
// =============================================================================

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
      />
    </svg>
  );
}

export default function ViewRawData() {
  const { teid } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/actionitem/view-test-rawdata", {
          params: { testeventdata_id: teid },
        });
        setData(res.data ?? null);
      } catch (err) {
        console.error("Error loading raw data:", err);
        toast.error("Failed to load raw data.");
      } finally {
        setLoading(false);
      }
    };
    if (teid) load();
  }, [teid]);

  if (loading) {
    return (
      <Page title="View Raw Data">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <Spinner /> Loading...
        </div>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="View Raw Data">
        <div className="flex h-[60vh] items-center justify-center text-gray-400">
          Nothing Here
        </div>
      </Page>
    );
  }

  // ── Confirmed field names from real API response ───────────────────────────
  const parameter = data.parameter ?? {};
  const env = data.environment ?? {};
  const lrn = data.lrn ?? "";
  const attachment = data.attachment ?? null;

  // PHP: parameterelements → column headers (measurements.name)
  // API: headers: ["Visual ", ...]
  const headers = Array.isArray(data.headers) ? data.headers : [];

  // PHP: for ($i=0; $i<$cycle; $i++) → testdata.value WHERE cycle=$i
  // API: data: [ [ {measurement_id, value, unit}, ... ], ... ]
  //            outer array = cycle rows, inner array = columns
  const rows = Array.isArray(data.data) ? data.data : [];

  return (
    <Page title="View Raw Data">
      <div className="transition-content w-full px-[var(--margin-x)] pb-10">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-100 text-lg font-semibold text-gray-800">
            View Raw Data
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          >
            ← Back
          </button>
        </div>

        <Card className="space-y-6 p-6">
          {/* ── LRN + Parameter info ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 sm:grid-cols-4 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                LRN
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                {lrn || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Parameter
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                {parameter.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Cycle
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                {parameter.cycle ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Test Event ID
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                {data.testevent_id ?? teid}
              </p>
            </div>
          </div>

          {/* ── Environment ───────────────────────────────────────────────────── */}
          {/* PHP: $temperature, $humidity, $remark, $startdate, $enddate        */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Environment
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-4 dark:bg-gray-800/40">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Temperature
                </p>
                <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                  {env.temperature ?? "—"} °C
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Humidity
                </p>
                <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                  {env.humidity ?? "—"} %
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Start Date
                </p>
                <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                  {env.startdate ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  End Date
                </p>
                <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                  {env.enddate ?? "—"}
                </p>
              </div>
              {env.remark && (
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Remark
                  </p>
                  <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                    {env.remark}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Measurements Table ────────────────────────────────────────────── */}
          {/* PHP: headers = measurements.name per parameterelements             */}
          {/* PHP: rows = testdata.value WHERE testevent=$teid AND cycle=$i      */}
          {/* API: headers: ["Visual "], data: [[{measurement_id,value,unit}]]  */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {/* PHP: Environment Fields {$prow['name']} */}
              Environment Fields — {parameter.name ?? "Measurements"}
            </h3>

            {headers.length > 0 && rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                        #
                      </th>
                      {/* PHP: $pname = selectfieldwhere("measurements","name","id=$pid") */}
                      {headers.map((h, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* PHP: for ($i=0; $i<$cycle; $i++) */}
                    {rows.map((cycleRow, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {i + 1}
                        </td>
                        {/* PHP: SELECT value FROM testdata WHERE testevent=$teid AND measurement=$pid AND cycle=$cycle */}
                        {/* API: each cell = { measurement_id, value, unit } */}
                        {Array.isArray(cycleRow) ? (
                          cycleRow.map((cell, j) => (
                            <td
                              key={j}
                              className="px-3 py-2 text-gray-700 dark:text-gray-300"
                            >
                              {cell.value ?? "—"}
                              {cell.unit && cell.unit !== "-" && (
                                <span className="ml-1 text-xs text-gray-400">
                                  {cell.unit}
                                </span>
                              )}
                            </td>
                          ))
                        ) : (
                          <td className="px-3 py-2 text-gray-400">—</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">
                No measurement data found.
              </p>
            )}
          </div>

          {/* ── Attachment — PHP: fetchattachment($row['attachment']) ─────────── */}
          {attachment && (
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <a
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
              >
                View Attachment
              </a>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
