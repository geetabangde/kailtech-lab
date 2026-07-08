// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import {
  Trash2Icon,
  PlusIcon,
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  MessageCircleIcon,
  FlagIcon,
  CheckCircle2Icon,
  PhoneCallIcon,
  UsersIcon,
} from "lucide-react";

// Local Imports
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";
import AddQuoteFollowUpModal from "./AddQuoteFollowUpModal";

// ----------------------------------------------------------------------


// Helper to safely parse dates from various formats (DD-MM-YYYY, DD/MM/YYYY)
const safeParseDate = (dateStr) => {
  if (!dateStr) return dayjs();
  if (typeof dateStr !== "string") return dayjs(dateStr);

  // Handle DD-MM-YYYY (with dashes)
  const ddmmyyyyDash = /^(\d{2})-(\d{2})-(\d{4})/;
  const matchDash = dateStr.match(ddmmyyyyDash);
  if (matchDash) {
    return dayjs(`${matchDash[3]}-${matchDash[2]}-${matchDash[1]}`);
  }

  // Handle DD/MM/YYYY (with slashes)
  const ddmmyyyySlash = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const matchSlash = dateStr.match(ddmmyyyySlash);
  if (matchSlash) {
    return dayjs(`${matchSlash[3]}-${matchSlash[2]}-${matchSlash[1]}`);
  }

  return dayjs(dateStr);
};

// ----------------------------------------------------------------------

export default function TQuotationFollowUp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(141)) {
      navigate("/dashboards/sales/testing-quotations");
      toast.error("You don't have permission to view follow-ups");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [closedCount, setClosedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // "Add" or "Close"

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const followupRes = await axios.get(`/sales/get-testing-followup/${id}`);

      // Process follow-up data to match calibration structure
      const rawData = followupRes.data.timeline || [];
      const processedData = [];
      
      // Group followup with next_followup like calibration does
      // The pattern is: next_followup, followup, next_followup, followup, etc.
      for (let i = 0; i < rawData.length; i++) {
        const current = rawData[i];
        
        if (current.type === "followup") {
          // Look for the immediate previous item if it's a next_followup
          let nextFollowUp = null;
          if (i - 1 >= 0 && rawData[i - 1].type === "next_followup") {
            nextFollowUp = rawData[i - 1];
          }
          
          // Create grouped item like calibration
          processedData.push({
            ...current,
            follow_up_type: current.mode,
            follow_up_date: current.date,
            subject: current.title,
            remark: current.remark,
            added_by: current.added_by,
            next_follow_up_type: nextFollowUp?.mode,
            next_follow_up_date: nextFollowUp?.date,
            internal_key: `grouped-${i}`
          });
        }
      }
      
      // Handle closed items (items with type: "closed")
      rawData.forEach(item => {
        if (item.type === "closed") {
          // This is a closed item, add it to processed data
          processedData.push({
            ...item,
            follow_up_type: null,
            follow_up_date: null,
            subject: null,
            remark: null,
            added_by: item.closed_by || item.added_by, // Handle both field names
            next_follow_up_type: null,
            next_follow_up_date: null,
            internal_key: `closed-${item.id}`
          });
        }
      });

      setData(processedData);
      setClosedCount(Number(followupRes.data.closed_count || 0));

      // Quotation data not available - header will show default values
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load follow-up details");
    } finally {
      setLoading(false);
    }
  }, [id]);

    useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const isClosed = closedCount > 0;

  if (loading) {
    return (
      <Page title="Track Quotation Follow-Up">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Retrieving interactions...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Track Quotation Follow-Up">
      <div className="flex flex-col grow h-full overflow-hidden transition-content">

        {/* Standard-style Header/Toolbar */}
        <div className="px-[var(--margin-x)] pt-4 pb-4 border-b border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
              >
                <ArrowLeftIcon size={18} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-dark-50 tracking-tight flex items-center gap-2">
                  Quotation Profile
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">
                    ID: {id}
                  </span>
                </h2>
                <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserIcon size={12} className="text-gray-400" />
                    Valuable Client
                  </span>
                </div>
              </div>
            </div>

            {!isClosed && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outlined"
                  className="h-9 border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
                  onClick={() => {
                    setModalMode("Close");
                    setIsModalOpen(true);
                  }}
                >
                  <Trash2Icon size={16} className="mr-2 text-red-500" />
                  Close Follow Up
                </Button>
                <Button
                  variant="filled"
                  className="h-9 !bg-blue-600 px-5 font-semibold shadow-md hover:!bg-blue-700 active:scale-95 transition-all"
                  onClick={() => {
                    setModalMode("Add");
                    setIsModalOpen(true);
                  }}
                >
                  <PlusIcon size={16} className="mr-2" />
                  Add Follow-Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-[var(--margin-x)] py-6 grow">
          <Card className="min-h-full flex flex-col p-6 sm:p-8">
            {data.length > 0 ? (
              <div className="relative">
                {/* Center Timeline Path */}
                <div className="absolute left-[20px] lg:left-1/2 top-0 h-full w-[2px] bg-gray-100 lg:-translate-x-1/2"></div>

                <div className="flex flex-col gap-8 lg:gap-12">
                  {data.map((item) => {
                    // Logic for "Closed" state from PHP: all follow_up fields empty
                    const isLegacyClosed = !item.follow_up_type && !item.follow_up_date && !item.next_follow_up_date && !item.next_follow_up_type;

                    if (isLegacyClosed) {
                      return (
                        <div key={item.internal_key || item.id} className="relative flex w-full flex-col lg:items-center">
                          <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-4 ring-white lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                            <FlagIcon size={18} />
                          </div>
                          <div className="mt-8 w-full lg:mt-0 lg:w-[50%] lg:self-center">
                            <div className="relative rounded-2xl border border-red-100 bg-red-50/50 p-6 pt-10 shadow-sm text-center">
                              <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-red-600">
                                  CLOSED
                                </span>
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              </div>
                              <p className="text-xl font-bold italic text-red-900 leading-relaxed">&quot;{item.reason}&quot;</p>
                              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-tight text-red-400">
                                <UserIcon size={14} />
                                CLOSED BY: <span className="text-red-600/70">
                                  {item.added_by}
                                </span> {dayjs(item.added_on).format("DD MMM, YYYY")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.internal_key || item.id} className="group relative flex w-full flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white transition-transform group-hover:scale-110 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                          <CheckCircle2Icon size={18} />
                        </div>

                        {/* LEFT SIDE: Interaction Details */}
                        <div className="w-full lg:w-[46%] lg:self-start lg:pr-4">
                          <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:bg-dark-800 dark:border-dark-700">
                            <div className="hidden lg:block absolute -right-2 top-8 h-4 w-4 rotate-45 border-r border-t border-gray-100 bg-white group-hover:border-blue-200 dark:bg-dark-800 dark:border-dark-700"></div>

                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 border border-blue-100">
                                {item.follow_up_type?.toLowerCase() === "meeting" ? (
                                  <UsersIcon size={10} />
                                ) : (
                                  <PhoneCallIcon size={10} />
                                )}
                                {item.follow_up_type}
                              </span>
                              <span className="text-[11px] font-bold text-gray-400">
                                {safeParseDate(item.follow_up_date || item.added_on).format("DD MMM, YYYY")}
                              </span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-dark-100 leading-tight mb-3">
                              {item.subject || item.title || "Interaction"}
                            </h4>
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 dark:bg-dark-900/50 dark:border-dark-700">
                              <p className="text-[14px] leading-relaxed text-gray-600 dark:text-dark-300 font-medium italic">
                                &quot;{item.remark || "-"}&quot;
                              </p>
                            </div>
                            <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                              <UserIcon size={14} className="text-blue-500" />
                              BY: <span className="text-gray-800 dark:text-dark-100 font-black">
                                {item.added_by}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT SIDE: Next Follow-Up */}
                        <div className="w-full lg:w-[46%] lg:self-start lg:pl-16">
                          {item.next_follow_up_date ? (
                            <div className="relative rounded-2xl border border-amber-100 bg-amber-50/20 p-5 shadow-sm transition-all hover:bg-amber-50/40 dark:bg-amber-900/10 dark:border-amber-800">
                              <div className="hidden lg:block absolute -left-2 top-8 h-4 w-4 rotate-45 border-l border-b border-amber-100 bg-white group-hover:bg-amber-50/40 dark:bg-dark-800 dark:border-amber-800"></div>

                              <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                                  <CalendarIcon size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500 leading-none mb-1">Next Follow Up</p>
                                  <p className="text-base font-bold text-gray-900 dark:text-dark-100">
                                    {safeParseDate(item.next_follow_up_date).format("DD MMM, YYYY")}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2 rounded-full bg-white dark:bg-dark-900 px-4 py-1.5 w-fit shadow-sm border border-amber-100 dark:border-amber-900/50">
                                {item.next_follow_up_type?.toLowerCase() === "meeting" ? (
                                  <UsersIcon size={12} className="text-amber-500" />
                                ) : (
                                  <PhoneCallIcon size={12} className="text-amber-500" />
                                )}
                                <span className="text-[11px] font-bold capitalize text-gray-600 dark:text-dark-300 tracking-tight">
                                  Through {item.next_follow_up_type}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="hidden lg:flex items-center gap-3 text-gray-300 dark:text-dark-600 italic text-xs pl-4 py-10 opacity-30">
                              <FlagIcon size={14} />
                              Interaction complete.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-dark-900 text-gray-300 dark:text-dark-700 mb-6">
                  <MessageCircleIcon size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100">No Follow-Up Recorded</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-400 max-w-sm">
                  There are no interactions logged for this quotation. Start a follow-up to keep track of progress.
                </p>
                {!isClosed && (
                  <Button
                    className="mt-8 h-11 !bg-blue-600 px-8 font-semibold !text-white shadow-lg active:scale-95"
                    onClick={() => {
                      setModalMode("Add");
                      setIsModalOpen(true);
                    }}
                  >
                    + Start Follow-Up
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <AddQuoteFollowUpModal
        show={isModalOpen}
        id={id}
        mode={modalMode}
        title={modalMode === "Close" ? "Close Quotation Follow-Ups" : "Add Quotation Follow-Up"}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFollowUps}
      />
    </Page>
  );
}
