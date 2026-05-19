// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { Edit3, ArrowLeft, Info, Package, User, Calendar, Tag } from "lucide-react";
import dayjs from "dayjs";

// Local Imports
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";

// ----------------------------------------------------------------------

export default function EditIndent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [masterData, setMasterData] = useState({ priority: [], indent_type: [] });
  const [indentData, setIndentData] = useState(null);
  const [items, setItems] = useState([]);

  // Fetch Master Data and Indent Details
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast.error("No indent ID provided");
        navigate("/dashboards/inventory/purchase-requisition");
        return;
      }

      try {
        setLoading(true);
        
        // Parallel fetch for master data and indent details
        const [masterRes, indentRes] = await Promise.all([
          axios.get("/inventory/indent-master-data"),
          axios.get(`/inventory/view-indent/${id}`) // Using view-indent for general edit
        ]);

        if (masterRes.data.status) {
          setMasterData(masterRes.data.data);
        }

        if (indentRes.data.status) {
          const { indent_details, requirement_items } = indentRes.data.data;
          setIndentData(indent_details);
          setItems(requirement_items || []);
        } else {
          toast.error("Failed to fetch indent details");
          navigate("/dashboards/inventory/purchase-requisition");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Something went wrong while loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleIndentChange = (field, value) => {
    setIndentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);

    try {
      // Map state back to PHP array format
      const payload = {
        id: id,
        priority_id: indentData.priority_id,
        indent_type_id: indentData.indent_type_id,
        id_req: items.map(item => item.id),
        specification: items.map(item => item.specification),
        quantity: items.map(item => item.quantity),
        remark: items.map(item => item.remark)
      };

      const response = await axios.post("/inventory/update-indent", payload);

      if (response.data.success || response.data.status) {
        toast.success("Indent updated successfully");
        navigate(`/dashboards/inventory/purchase-requisition/view-full-indent?hakuna=${id}`);
      } else {

        toast.error(response.data.message || "Failed to update indent");
      }
    } catch (error) {
      console.error("Error updating indent:", error);
      toast.error("Something went wrong while updating indent");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Edit Requisition">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Page>
    );
  }

  if (!indentData) return null;

  return (
    <Page title={`Edit Requisition ${indentData.indent_number}`}>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between px-1">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-orange-500" /> Edit Mode
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{indentData.indent_number}</h2>
                <p className="text-white/70 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Raised on {dayjs(indentData.added_on).format("DD MMM YYYY")}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-8">
              {/* Header Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <User className="w-3 h-3" /> Employee
                    </label>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{indentData.employee?.employee_name}</div>
                      <div className="text-xs text-slate-500">Code: {indentData.employee?.employee_code}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Tag className="w-3 h-3" /> Priority
                    </label>
                    <select
                      value={indentData.priority_id}
                      onChange={(e) => handleIndentChange("priority_id", e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all appearance-none cursor-pointer font-bold"
                    >
                      {masterData.priority.map(p => (
                        <option key={p.id} value={p.id}>{p.priority_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Package className="w-3 h-3" /> Indent Type
                    </label>
                    <select
                      value={indentData.indent_type_id}
                      onChange={(e) => handleIndentChange("indent_type_id", e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all appearance-none cursor-pointer font-bold"
                    >
                      {masterData.indent_type.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2 mb-1">
                        <Info className="w-3 h-3" /> Status Restriction
                      </div>
                      <p className="text-[11px] text-orange-500 leading-relaxed">
                        Editing is only allowed for indents in &quot;Pending&quot; status. Once approved, quantities can only be modified by the approver.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-500" /> Product Details
                  </h3>
                  <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {items.length} Items Total
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Item Description</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specification</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Quantity</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-400">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.instrument_name}</div>
                          </td>
                          <td className="px-4 py-4">
                            <Input
                              value={item.specification}
                              onChange={(e) => handleItemChange(index, "specification", e.target.value)}
                              placeholder="e.g. Size, Grade..."
                              className="h-10 text-sm font-medium border-slate-200"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                className="h-10 text-center font-black text-orange-600 border-orange-200"
                                min="1"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Input
                              value={item.remark}
                              onChange={(e) => handleItemChange(index, "remark", e.target.value)}
                              placeholder="Internal notes..."
                              className="h-10 text-sm font-medium border-slate-200"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium max-w-md italic leading-relaxed">
                * Review all changes carefully. Updating a requisition will reset the notification alerts for the approval team.
              </p>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="px-8 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="px-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 font-bold text-white"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
