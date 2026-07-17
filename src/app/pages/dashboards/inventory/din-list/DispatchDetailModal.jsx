import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import axios from "utils/axios";
import { Button } from "components/ui";

export function DispatchDetailModal({ isOpen, onClose, onSuccess, type, row }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dispatchthrough: "",
    dispatchdate: dayjs().format("YYYY-MM-DD"),
    expectedreturn: "",
    dispatchdetial: "",
    // dynamically required depending on dispatchthrough
    empname: "",
    consignname: "",
    consignphone: "",
    courriername: "",
    courrierno: "",
    vehicleno: "",
    personname: "",
    personphone: "",
  });

  const isReturnable = row?.original?.basis === "Returnable";
  
  useEffect(() => {
    if (isOpen && row?.original) {
      // Initialize with existing data from row if available
      setFormData({
        dispatchthrough: row.original.dispatchthrough || "",
        dispatchdate: row.original.dispatchdate 
          ? dayjs(row.original.dispatchdate, "DD/MM/YYYY").isValid() 
            ? dayjs(row.original.dispatchdate, "DD/MM/YYYY").format("YYYY-MM-DD")
            : dayjs(row.original.dispatchdate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        expectedreturn: row.original.expectedreturn
          ? dayjs(row.original.expectedreturn, "DD/MM/YYYY").isValid()
            ? dayjs(row.original.expectedreturn, "DD/MM/YYYY").format("YYYY-MM-DD")
            : dayjs(row.original.expectedreturn).format("YYYY-MM-DD")
          : "",
        dispatchdetial: row.original.dispatchdetial || "",
        empname: row.original.empname || "",
        consignname: row.original.consignname || "",
        consignphone: row.original.consignphone || "",
        courriername: row.original.courriername || "",
        courrierno: row.original.courrierno !== "NA" ? row.original.courrierno : "",
        vehicleno: row.original.vehicleno || "",
        personname: row.original.personname || "",
        personphone: row.original.personphone || "",
      });
    }
  }, [isOpen, row]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dispatchthrough) {
      toast.error("Please select a Dispatch Through method.");
      return;
    }
    if (!formData.dispatchdate) {
      toast.error("Please enter a Dispatch Date.");
      return;
    }
    if (isReturnable && !formData.expectedreturn) {
      toast.error("Please enter Expected Return Date.");
      return;
    }
    if (!formData.dispatchdetial.trim()) {
      toast.error("Please enter Dispatch Details.");
      return;
    }

    try {
      setLoading(true);
      // Determine the correct endpoint, fallback to a standard save if needed
      // Assuming a generic insert/update dispatch detail endpoint exists
      const endpoint = type === "add" ? "inventory/add-dispatch-detail" : "inventory/edit-dispatch-detail";
      
      const payload = {
        id: row.original.id,
        ...formData,
      };

      const res = await axios.post(endpoint, payload);
      if (res.data.status || res.data.success) {
        toast.success(`Dispatch detail ${type === "add" ? "added" : "updated"} successfully.`);
        onSuccess();
      } else {
        toast.error(res.data.message || "Failed to save dispatch detail.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as="div">
      <Dialog as="div" className="relative z-[999]" onClose={onClose}>
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity dark:bg-black/70" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative w-full transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all dark:bg-dark-800 sm:my-8 sm:max-w-lg">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-600 dark:bg-dark-700 sm:px-6">
                  <Dialog.Title
                    as="h3"
                    className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-100"
                  >
                    {type === "add" ? "Add Dispatch Detail" : "Edit Dispatch Detail"}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:outline-none dark:hover:bg-dark-600 dark:hover:text-dark-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    {!row?.original?.dispatchthrough || type === "add" ? (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                          Dispatch Through
                        </label>
                        <select
                          name="dispatchthrough"
                          value={formData.dispatchthrough}
                          onChange={handleChange}
                          className="form-select w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                        >
                          <option value="">Select One</option>
                          <option value="1">By Hand</option>
                          <option value="2">Consignee</option>
                          <option value="3">Courier</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                          Dispatch Through
                        </label>
                        <select
                          name="dispatchthrough"
                          value={formData.dispatchthrough}
                          disabled
                          className="form-select w-full rounded-lg border-gray-300 bg-gray-100 dark:border-dark-600 dark:bg-dark-700"
                        >
                          <option value="1">By Hand</option>
                          <option value="2">Consignee</option>
                          <option value="3">Courier</option>
                        </select>
                      </div>
                    )}

                    {/* Dynamic Fields based on dispatchthrough */}
                    {formData.dispatchthrough === "1" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                          Employee Name
                        </label>
                        <input
                          type="text"
                          name="empname"
                          value={formData.empname}
                          onChange={handleChange}
                          className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                        />
                      </div>
                    )}

                    {formData.dispatchthrough === "2" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                            Consignee Name
                          </label>
                          <input
                            type="text"
                            name="consignname"
                            value={formData.consignname}
                            onChange={handleChange}
                            className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                            Consignee Phone
                          </label>
                          <input
                            type="text"
                            name="consignphone"
                            value={formData.consignphone}
                            onChange={handleChange}
                            className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </div>
                      </div>
                    )}

                    {formData.dispatchthrough === "3" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                            Courier Name
                          </label>
                          <input
                            type="text"
                            name="courriername"
                            value={formData.courriername}
                            onChange={handleChange}
                            className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                            Docket No / Courier No
                          </label>
                          <input
                            type="text"
                            name="courrierno"
                            value={formData.courrierno}
                            onChange={handleChange}
                            className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        name="dispatchdate"
                        value={formData.dispatchdate}
                        onChange={handleChange}
                        className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                      />
                    </div>

                    {isReturnable && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                          Expected Returnable Date
                        </label>
                        <input
                          type="date"
                          name="expectedreturn"
                          value={formData.expectedreturn}
                          onChange={handleChange}
                          className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-dark-200">
                        Dispatch Detail
                      </label>
                      <textarea
                        name="dispatchdetial"
                        rows="3"
                        value={formData.dispatchdetial}
                        onChange={handleChange}
                        className="form-textarea w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                        placeholder="Enter dispatch details here..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-dark-600">
                    <Button type="button" variant="soft" color="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" color="primary" disabled={loading}>
                      {loading ? "Saving..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

DispatchDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["add", "edit"]).isRequired,
  row: PropTypes.object,
};
