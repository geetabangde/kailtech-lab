// Import Dependencies
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { Plus } from "lucide-react";
import dayjs from "dayjs";

// Local Imports
import { Page } from "components/shared/Page";
import { Button, Card, Table } from "components/ui";

// ----------------------------------------------------------------------

export default function StockTransferList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  // DataTable states
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/inventory/stock-transfer-data", {
        params: {
          draw: 1,
          start: pagination.pageIndex * pagination.pageSize,
          length: pagination.pageSize,
        }
      });
      
      if (response.data.data) {
        setData(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching transfer data:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo(() => [
    {
      header: "Sr.No",
      accessorKey: "sr_no",
      cell: (info) => info.row.index + 1 + pagination.pageIndex * pagination.pageSize,
    },
    {
      header: "Item Name",
      accessorKey: "insname",
      cell: (info) => <span className="font-semibold text-gray-800 dark:text-gray-200">{info.getValue()}</span>,
    },
    {
      header: "From Location",
      accessorKey: "from_location_name",
    },
    {
      header: "To Location",
      accessorKey: "to_location",
    },
    {
      header: "Batch No.",
      accessorKey: "batchno",
      cell: (info) => <span className="text-gray-500">{info.getValue() || "—"}</span>,
    },
    {
      header: "Quantity",
      accessorKey: "qty",
      cell: (info) => <span className="font-bold text-blue-600">{info.getValue()} {info.row.original.unit_name || ""}</span>,
    },
    {
      header: "Transfer By",
      accessorKey: "firstname",
    },
    {
      header: "Transfer On",
      accessorKey: "added_on",
      cell: (info) => dayjs(info.getValue()).format("DD/MM/YYYY HH:mm:ss"),
    },
  ], [pagination]);

  return (
    <Page title="Stock Transfer List">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Stock Transfer
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboards/inventory/purchase-requisition")}
              className="text-white bg-blue-600 hover:bg-blue-700 px-6 font-semibold shadow-sm"
            >
              &lt;&lt; Back to Requisition
            </Button>
            <Button
              onClick={() => navigate("/dashboards/inventory/purchase-requisition/add-transfer-item")}
              className="text-white bg-blue-600 hover:bg-blue-700 px-6 font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Transfer Item
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800 overflow-hidden">
          <div className="p-0">
            <Table
              data={data}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
        </Card>
      </div>
    </Page>
  );
}
