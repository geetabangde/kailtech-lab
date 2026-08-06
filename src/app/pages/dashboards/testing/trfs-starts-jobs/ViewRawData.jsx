import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";

export default function ViewRawData() {
  const { id } = useParams(); // trfproduct id
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRawData = async () => {
      try {
        setLoading(true);
        // Calls the new Laravel API method you'll define in the backend
        const res = await axios.get(`/testing/trfs-starts-jobs/raw-data/${id}`);
        setData(res.data?.data || []);
      } catch (error) {
        console.error("Error fetching raw data", error);
        setData([]); // Ensure we fall back to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRawData();
  }, [id]);

  if (loading) {
    return (
      <Page title="View Raw Data">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title="View Raw Data">
      <div className="px-4 pb-5 sm:px-5 sm:pt-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            View Raw Data
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 dark:hover:bg-dark-700"
          >
            Back
          </button>
        </div>

        {(!data || data.length === 0) ? (
          <Card className="p-10 text-center text-gray-500">
            <h3 className="text-xl font-bold mb-2">No Raw Data Found</h3>
            <p className="text-sm">There is no test environment data available for this record.</p>
            <button
              className="mt-6 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              onClick={() => navigate("/dashboards/testing/trfs-starts-jobs")}
            >
              Back To TRF Starts Jobs
            </button>
          </Card>
        ) : (
          data.map((item, index) => (
            <Card key={index} className="mb-6 overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-800">
                <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50">
                  Environment Fields {item.parameter_name}
                </h3>
              </div>
              
              <div className="p-4 sm:p-5">
                <div className="mb-5 text-sm text-gray-700 dark:text-dark-200">
                  <p className="mb-2">
                    <span className="font-semibold text-gray-900 dark:text-dark-50">Result: </span> 
                    {item.testresult}
                  </p>
                  <p className="flex items-start">
                    <span className="w-20 flex-shrink-0 font-semibold text-gray-900 dark:text-dark-50">Formulae: </span> 
                    <span className="flex-1 whitespace-pre-wrap">{item.formulae}</span>
                  </p>
                </div>

                <div className="table-wrapper mb-5 overflow-x-auto rounded border border-gray-200 dark:border-dark-500">
                  <Table className="w-full text-left">
                    <THead>
                      <Tr>
                        {item.measurements?.map((m, i) => (
                          <Th key={i} className="bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:bg-dark-800 dark:text-dark-100">
                            {m}
                          </Th>
                        ))}
                      </Tr>
                    </THead>
                    <TBody>
                      {item.cycles?.map((cycleRow, rIdx) => (
                        <Tr key={rIdx} className="border-t border-gray-200 hover:bg-gray-50 dark:border-dark-500 dark:hover:bg-dark-800">
                          {cycleRow.values?.map((val, cIdx) => (
                            <Td key={cIdx} className="px-4 py-2.5 text-sm">
                              {val}
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>

                <div className="text-sm text-gray-700 dark:text-dark-200">
                  <p className="mb-2">
                    <span className="font-semibold text-gray-900 dark:text-dark-50">Remark : </span> 
                    {item.remark || "-"}
                  </p>
                  {item.attachment && (
                    <p>
                      <a 
                        href={item.attachment} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-medium text-red-500 hover:text-red-600 hover:underline"
                      >
                        View Attachment
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Page>
  );
}