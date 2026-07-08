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
  UsersIcon
} from "lucide-react";

// Local Imports
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";
import AddFollowUpModal from "./AddFollowUpModal";

// ----------------------------------------------------------------------

// Helper component to fetch and display "Created By" user details
// Uses an in-memory cache to optimize performance when the same user appears multiple times
const userCache = {};

function CreatedByInfo({ userId, fallbackName }) {
  const [user, setUser] = useState(userCache[userId] || (fallbackName ? { name: fallbackName } : null));
  const [loading, setLoading] = useState(!userCache[userId] && !!userId && !fallbackName);

  useEffect(() => {
    if (!userId || userCache[userId]) return;

    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/get-created-by/${userId}`);
        if (res.data && isMounted) {
          userCache[userId] = res.data;
          setUser(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) return <span className="inline-block h-3 w-20 animate-pulse rounded bg-gray-200 align-middle" />;
  if (!user?.name) return <span className="text-gray-400 italic">Unassigned</span>;

  return (
    <span title={user.designation ? `${user.designation} (${user.employee_id})` : ""}>
      {user.name}
    </span>
  );
}

// ----------------------------------------------------------------------

export default function EnquiryFollowUp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(91)) {
      navigate("/dashboards");
      toast.error("You don't have permission to view enquiry follow-ups");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [enquiry, setEnquiry] = useState(null);
  const [closedCount, setClosedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // "Add" or "Close"

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const [followupRes, enquiryRes] = await Promise.all([
        axios.get(`/sales/get-follow-ups/${id}`),
        axios.get(`/sales/get-enquiry-byid`, { params: { id } })
      ]);
      if (followupRes.data.status === true || followupRes.data.status === "true") {
        setData(followupRes.data.data || []);
        setClosedCount(Number(followupRes.data.closed_followups || 0));
      }
      if (enquiryRes.data.status === true || enquiryRes.data.status === "true") {
        setEnquiry(enquiryRes.data.data?.[0]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load details");
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
      <Page title="Track Follow-Up">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Retrieving interactions...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Track Follow-Up">
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
                  {enquiry?.name || "Enquiry Profile"}
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">
                    ID: {id}
                  </span>
                </h2>
                <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserIcon size={12} className="text-gray-400" />
                    {enquiry?.vertical_name}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold uppercase tracking-tighter">
                    {enquiry?.ctypename}
                  </span>
                </div>
              </div>
            </div>

            {!isClosed && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outlined"
                  className="h-9 border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                  onClick={() => {
                    setModalMode("Close");
                    setIsModalOpen(true);
                  }}
                >
                  <Trash2Icon size={16} className="mr-2 text-red-500" />
                  Close Enquiry
                </Button>
                <Button
                  variant="filled"
                  className="h-9 !bg-blue-600 px-5 font-semibold shadow-md hover:!bg-blue-700 active:scale-95"
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
                    const isLegacyClosed = !item.follow_up_type && !item.follow_up_date && !item.next_follow_up_date && !item.next_follow_up_type;

                    if (isLegacyClosed) {
                      return (
                        <div key={item.id} className="relative flex w-full flex-col lg:items-center">
                          {/* Point */}
                          <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-4 ring-white lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                            <FlagIcon size={18} />
                          </div>

                          {/* Centered Closed Card */}
                          <div className="mt-8 w-full lg:mt-0 lg:w-[45%] lg:self-center">
                            <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest text-red-600">Enquiry Closed</span>
                              </div>
                              <p className="text-sm font-semibold italic text-red-800 leading-relaxed">&quot;{item.reason || "Finalized."}&quot;</p>
                              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight text-red-400">
                                <UserIcon size={12} />
                                <CreatedByInfo userId={item.added_by} fallbackName={item.added_by_name} /> • {dayjs(item.added_on).format("DD MMM, YYYY")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="group relative flex w-full flex-col gap-4 lg:flex-row lg:items-center">
                        {/* Central Icon Point */}
                        <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white transition-transform group-hover:scale-110 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                          <CheckCircle2Icon size={18} />
                        </div>

                        {/* LEFT SIDE: Interaction Details */}
                        <div className="w-full lg:w-[46%] lg:self-start lg:pr-4">
                          <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                            {/* Small arrow for LG screens */}
                            <div className="hidden lg:block absolute -right-2 top-8 h-4 w-4 rotate-45 border-r border-t border-gray-100 bg-white group-hover:border-blue-200"></div>

                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-600 border border-blue-100">
                                {item.follow_up_type?.toLowerCase() === "meeting" ? (
                                  <UsersIcon size={10} />
                                ) : (
                                  <PhoneCallIcon size={10} />
                                )}
                                {item.follow_up_type}
                              </span>
                              <span className="text-[11px] font-bold text-gray-400">
                                {dayjs(item.follow_up_date).format("DD MMM, YYYY")}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 leading-tight">
                              {item.subject}
                            </h4>
                            <p className="mt-3 text-[13px] leading-relaxed text-gray-600 font-medium italic bg-gray-50/50 p-3 rounded-lg border border-dashed border-gray-200">
                              &quot;{item.remark}&quot;
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                              <UserIcon size={12} className="text-blue-500" />
                              By: <span className="text-gray-700 font-bold"><CreatedByInfo userId={item.added_by} fallbackName={item.added_by_name} /></span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT SIDE: Next Follow-Up (If exists) */}
                        <div className="w-full lg:w-[46%] lg:self-start lg:pl-16">
                          {item.next_follow_up_date ? (
                            <div className="relative rounded-2xl border border-amber-100 bg-amber-50/30 p-5 shadow-sm transition-all hover:bg-amber-50">
                              {/* Small arrow for LG screens */}
                              <div className="hidden lg:block absolute -left-2 top-8 h-4 w-4 rotate-45 border-l border-b border-amber-100 bg-white group-hover:bg-amber-50"></div>

                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                  <CalendarIcon size={16} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 leading-none">Next Follow Up</p>
                                  <p className="mt-1 text-sm font-bold text-gray-800">
                                    {dayjs(item.next_follow_up_date).format("DD MMM, YYYY")}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 w-fit shadow-xs border border-amber-100">
                                {item.next_follow_up_type?.toLowerCase() === "meeting" ? (
                                  <UsersIcon size={12} className="text-amber-500" />
                                ) : (
                                  <PhoneCallIcon size={12} className="text-amber-500" />
                                )}
                                <span className="text-[10px] font-black capitalize text-gray-600 tracking-tighter">
                                  Through {item.next_follow_up_type}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="hidden lg:flex items-center gap-3 text-gray-300 italic text-xs pl-4 py-8 opacity-20">
                              <FlagIcon size={14} />
                              Continuing interaction...
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
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300 mb-6">
                  <MessageCircleIcon size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No History Recorded</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm">
                  There are no interactions logged for this enquiry. Start a follow-up to keep track of progress.
                </p>
                {!isClosed && (
                  <Button
                    className="mt-8 h-11 !bg-blue-600 px-8 font-semibold !text-white shadow-lg active:scale-95"
                    onClick={() => {
                      setModalMode("Add");
                      setIsModalOpen(true);
                    }}
                  >
                    + Start First Follow-Up
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <AddFollowUpModal
        show={isModalOpen}
        id={id}
        mode={modalMode}
        title={modalMode === "Close" ? "Close Enquiry" : "Add Follow-Up"}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFollowUps}
      />
    </Page>
  );
}
