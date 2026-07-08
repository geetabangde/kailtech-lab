import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Card } from "components/ui";

export default function ViewPlannerIntermediateCheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract URL parameter
  const hakuna = searchParams.get('hakuna');

  const [checkData, setCheckData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // API call function
  const fetchCheckData = useCallback(async () => {
    if (!hakuna) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(`/material/view-intermidiate-check/${hakuna}`);

      if (response.data && response.data.success) {
        setCheckData(response.data.check);
        setObservations(response.data.observations || []);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setCheckData(null);
        setObservations([]);
      }
    } catch (err) {
      console.error("Error fetching check data:", err);
      setCheckData(null);
      setObservations([]);
    } finally {
      setLoading(false);
    }
  }, [hakuna]);

  // Fetch data on mount
  useEffect(() => {
    fetchCheckData();
  }, [fetchCheckData]);

  // Handler for Back button
  const handleBack = () => {
    navigate(-1);
  };

  // Get month name from month number
  const getMonthName = (monthNum) => {
    const months = {
      1: "January", 2: "February", 3: "March", 4: "April",
      5: "May", 6: "June", 7: "July", 8: "August",
      9: "September", 10: "October", 11: "November", 12: "December"
    };
    return months[parseInt(monthNum)] || monthNum;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg
          className="animate-spin h-6 w-6 mr-2 text-blue-600"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
          ></path>
        </svg>
        Loading Data...
      </div>
    );
  }

  if (!checkData) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <p>No data found</p>
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 px-[var(--margin-x)] py-4">
      {/* Header */}
      <div className="flex items-center justify-between space-x-4 mb-6">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Initiate Intermediate Check
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-9 space-x-1.5 rounded-md px-4 text-sm"
            color="primary"
            onClick={handleBack}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back</span>
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-40">Lab Name</span>
          <span className="text-gray-900">{checkData.name || "N/A"}</span>
        </div>
        
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-40">Month Year</span>
          <span className="text-gray-900">
            {getMonthName(checkData.month)} {checkData.year}
          </span>
        </div>
        
        <div className="font-semibold text-gray-700 mb-2">
          Intermediate Check
        </div>
      </div>

      {/* Observations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                  S.No
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                  Master Use for Check
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                  Calib Point
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300" colSpan={4}>
                  Observation
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                  Average
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Error
                </th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="border-r border-gray-300"></th>
                <th className="border-r border-gray-300"></th>
                <th className="border-r border-gray-300"></th>
                <th className="border-r border-gray-300"></th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">
                  Observation 1
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">
                  Observation 2
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">
                  Observation 3
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300">
                  &nbsp;
                </th>
                <th className="border-r border-gray-300"></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {observations.length > 0 ? (
                observations.map((obs, index) => (
                  <tr key={obs.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value={`50 Turn Current Coil KTRC-MS-0001`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value="kilogram"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value={obs.point || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value={obs.masterobs1 || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                      />
                      <br />
                      <input
                        type="text"
                        value={obs.uucobs1 || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white mt-2"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value={obs.masterobs2 || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                      />
                      <br />
                      <input
                        type="text"
                        value={obs.uucobs2 || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white mt-2"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value={obs.masterobs3 || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                      />
                      <br />
                      <input
                        type="text"
                        value={obs.uucobs3 || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white mt-2"
                      />
                    </td>
                    <td className="px-2 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value=""
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                      />
                      <br />
                      <input
                        type="text"
                        value=""
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white mt-2"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-300">
                      <input
                        type="text"
                        value={obs.masteravg || ""}
                        readOnly
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={obs.error || "0"}
                        readOnly
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No observations available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}