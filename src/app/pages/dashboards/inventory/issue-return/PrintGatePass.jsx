// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

// Local Imports
import { 
  Card, 
  Button
} from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

function mapGatePassResponse(data) {
  return {
    record: {
      gatpassnumber: data.gatepass_number,
      gatepassdate_formatted: data.gatepass_date,
      expectedreturn_formatted: data.expected_return,
      basis: data.basis,
      remark: data.remark,
      customer_name: data.customer?.customer_name,
      customer_address_text: data.customer?.address,
      customer_contact_name: data.customer?.contact_person,
      issuedtoname: data.issued_to?.name,
      issuedtcode: data.issued_to?.code,
      issuedbycode: data.issued_by?.details,
      added_on_formatted: data.issued_by?.generated_on,
      total_quantity: data.total_quantity,
    },
    items: (data.items || []).map((item) => ({
      sr_no: item.sr_no,
      idno: item.id_number,
      serialno: item.serial_number,
      name: item.item_name,
      qty: item.quantity,
    })),
  };
}

export default function PrintGatePass() {
  const [searchParams] = useSearchParams();
  const gatepassNo = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [items, setItems] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  const fetchData = useCallback(async () => {
    if (!gatepassNo) return;
    try {
      setLoading(true);
      const [response, companyResponse] = await Promise.all([
        axios.get("/inventory/print-get-pass", {
          params: { gatepassnumber: gatepassNo }
        }),
        axios.get("/get-company-info").catch((err) => {
          console.error("Failed to fetch company info", err);
          return { data: { status: false } };
        })
      ]);

      if (companyResponse.data.status) {
        setCompanyInfo(companyResponse.data.data);
      }

      if (response.data.status) {
        const mappedGatePass = mapGatePassResponse(response.data.data || {});
        setRecord(mappedGatePass.record);
        setItems(mappedGatePass.items);
      } else {
        toast.error(response.data.message || "Failed to fetch gatepass data");
      }
    } catch (err) {
      console.error("Error fetching gatepass data:", err);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  }, [gatepassNo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Page title="Gate Pass"><div className="p-10 text-center text-gray-500">Loading gate pass data...</div></Page>;
  }

  if (!record) {
    return <Page title="Gate Pass"><div className="p-10 text-center text-red-500">Gate Pass record not found</div></Page>;
  }

  const totalQty = record.total_quantity ?? items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
  const companyName = companyInfo?.company?.name || "";
  const companyAddress = companyInfo?.address?.full_address || "";
  const companyPhone = companyInfo?.contact?.phone || "";
  const companyEmail = companyInfo?.contact?.email || "";
  const companyWeb = companyInfo?.contact?.website || "";

  return (
    <Page title={`Gate Pass ${gatepassNo}`}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="transition-content w-full pb-5">
        <Card className="print-area border border-gray-200 p-3 shadow-soft dark:border-dark-500 dark:bg-dark-700 sm:p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-dark-500">
            <h3 className="text-lg font-normal text-gray-800 dark:text-dark-100">
              Returnable Challan
            </h3>
            <div className="no-print flex items-center gap-2 text-sm">
              <Button
                component={Link}
                to="/dashboards/inventory/issue-return"
                color="info"
                variant="filled"
                size="sm"
              >
                {"<< Back to Issued item list"}
              </Button>
              <Button
                component={Link}
                to={`/dashboards/inventory/issue-return/view-checklist?hakuna=${gatepassNo}`}
                color="info"
                variant="filled"
                size="sm"
              >
                {"<< View Checklist"}
              </Button>
            </div>
          </div>

          <div className="min-h-[620px] bg-white p-2 text-black dark:bg-white">
            <div className="grid grid-cols-[1fr_2fr_1fr] items-start">
              <div className="-mt-4">
                {companyInfo?.branding?.logo ? (
                  <img
                    src={companyInfo.branding.logo}
                    alt={companyInfo.branding.site_logo_alt || "Company Logo"}
                    className="h-[50px] w-auto object-contain"
                  />
                ) : (
                  <div className="h-[50px] w-32 border border-gray-300 bg-yellow-400 text-center text-2xl font-bold italic lowercase text-white">
                    ktrc
                  </div>
                )}
              </div>
              <div className="pt-16 text-center">
                <h1 className="text-[22px] leading-tight">{companyName}</h1>
                <p className="mt-1 whitespace-nowrap text-[10px] leading-4">{companyAddress}</p>
                <p className="text-[10px] leading-4">{companyPhone}</p>
                <p className="text-[10px] leading-4">
                  Email: {companyEmail} , Web: {companyWeb}
                </p>
              </div>
              <div className="-mt-4 text-left text-xs leading-tight">
                <p>NABL Accredited</p>
                <p>BIS Recognized</p>
                <p>ISO 9001:2015 Certified Lab</p>
              </div>
            </div>

            <div className="mt-2 text-right text-xs leading-5">
              <p>{record.gatpassnumber || gatepassNo}</p>
              <p>{record.gatepassdate_formatted}</p>
              <p>
                Approximate Return : {record.expectedreturn_formatted} Basis: {record.basis}
              </p>
            </div>

            <div className="mt-2 grid grid-cols-3 items-start text-xs">
              <div className="font-bold">M/s {record.customer_name}</div>
              <div className="pt-4 text-center text-sm leading-5">
                <p>Kind Attn.. {record.customer_contact_name || "---"}</p>
                <p className="whitespace-nowrap">
                  Material Issued To: {record.issuedtoname}
                  {record.issuedtcode ? ` (${record.issuedtcode})` : ""}
                </p>
              </div>
              <div />
            </div>

            <table className="mt-12 w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 text-left font-bold">Sr No</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">ID Number</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Serial Number</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Name Of The Item And Spares</th>
                  <th className="border border-gray-300 p-2 text-left font-bold">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.sr_no || index}>
                    <td className="border border-gray-300 p-2">{item.sr_no || index + 1}</td>
                    <td className="border border-gray-300 p-2">{item.idno}</td>
                    <td className="border border-gray-300 p-2">{item.serialno}</td>
                    <td className="border border-gray-300 p-2">{item.name}</td>
                    <td className="border border-gray-300 p-2">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="border border-gray-300 p-2">Total</td>
                  <td className="border border-gray-300 p-2">{totalQty}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-1 text-xs">Remark:{record.remark || ""}</div>

            <div className="mt-1 text-right text-xs font-bold">
              <p>Gate Pass Generated by:</p>
              <p>Name:{record.issuedbycode}</p>
              <p>Date {record.added_on_formatted}</p>
            </div>

            <div className="no-print mt-8 flex justify-end border-t border-gray-200 pt-4">
              <Button onClick={handlePrint} color="success" variant="filled" size="sm">
                Print Gate Pass
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
