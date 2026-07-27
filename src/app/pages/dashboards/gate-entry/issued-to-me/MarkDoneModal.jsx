import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import ReactSelect from "react-select";

export function MarkDoneModal({ isOpen, onClose, gateEntry, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [trfs, setTrfs] = useState([]);
  const [selectedTrfs, setSelectedTrfs] = useState([]);
  const [remark, setRemark] = useState("");
  const [textareaLabel, setTextareaLabel] = useState("Share Details For Completion (LRN/BRN/Docket etc)*");

  const isTesting = gateEntry?.purpose_name?.toLowerCase() === "testing" || gateEntry?.purpose == "1";

  useEffect(() => {
    if (isOpen && gateEntry?.id) {
      const fetchData = async () => {
        setFetchingData(true);
        try {
          const response = await axios.get(`/gate-entry/gate-entry-mark-done/${gateEntry.id}`);

          if (response.data.status) {
            const data = response.data.data;
            if (data.textarea_label) {
              setTextareaLabel(data.textarea_label);
            }
            if (Array.isArray(data.trf_list)) {
              setTrfs(
                data.trf_list.map((t) => ({
                  value: t.id,
                  label: t.display_text
                }))
              );
            }
          }
        } catch (err) {
          console.error("Error fetching modal data:", err);
        } finally {
          setFetchingData(false);
        }
      };
      fetchData();
    } else if (!isOpen) {
      // Reset state on close
      setRemark("");
      setSelectedTrfs([]);
      setTrfs([]);
    }
  }, [isOpen, gateEntry?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!remark) {
      toast.error("Please enter a remark or details");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hakuna: gateEntry.id,
        remark,
      };

      if (isTesting) {
        payload.trfid = selectedTrfs.map(t => t.value);
      }

      // Adjust endpoint to match your update item status API if needed
      const response = await axios.post(`/gate-entry/update-gate-entry`, payload);

      if (
        response.data.status === true ||
        response.data.status === "true" ||
        response.data.status === 200 ||
        response.data.status === 1 ||
        response.data.status === "success" ||
        response.status === 200 && response.data.status == null
      ) {
        toast.success("Item status updated successfully");
        if (onUpdate) onUpdate();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating status");
    } finally {
      setLoading(false);
    }
  };

  if (!gateEntry) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-dark-800">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white border-b pb-2 mb-4"
                >
                  {isTesting ? "Mark BRN/LRN Done" : "Accept Item"}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Purpose</label>
                      <div className="text-sm font-semibold">{gateEntry.purpose_name || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Source</label>
                      <div className="text-sm font-semibold">{gateEntry.source || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Alloted To</label>
                      <div className="text-sm font-semibold">{gateEntry.uname || '-'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500">Description</label>
                    <div className="text-sm font-semibold p-2 bg-gray-50 dark:bg-dark-900 rounded-md">
                      {gateEntry.description || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {textareaLabel}
                    </label>
                    <textarea
                      required
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-900"
                      rows={3}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>

                  {isTesting && (
                    <div>
                      <label className="block text-sm font-medium mb-1">TRF Entry No</label>
                      <ReactSelect
                        isMulti
                        options={trfs}
                        value={selectedTrfs}
                        onChange={setSelectedTrfs}
                        placeholder={fetchingData ? "Loading TRFs..." : "Select TRFs"}
                        menuPortalTarget={document.body}
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "42px",
                            borderRadius: "0.5rem",
                            borderColor: "#D1D5DB",
                            boxShadow: "none",
                            "&:hover": { borderColor: "#9CA3AF" },
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      color="success"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Item Status"}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
