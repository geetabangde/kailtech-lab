import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { useEffect, useState, useCallback, Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Input, GhostSpinner } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
export default function EditModal({ show, id, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [stock, setStock] = useState({
    product_name: "",
    id_no: "",
    type: "",
    location: "",
    manufacturer: "",
    source: "",
    batch_no: "",
    expdate: "",
    quantity: "",
    units: "",
  });

  const fetchStockDetail = useCallback(async () => {
    if (!id) return;
    try {
      setFetching(true);
      const response = await axios.get(`/profile/department-stock-getbyid/${id}`);

      if (response.data.status && response.data.data) {
        const data = response.data.data;

        const cleanVal = (val) => (typeof val === 'string' && val.includes('<br />')) ? "" : (val || "");

        let displayId = data.idno_display || "";
        if (!displayId && data.idno) {
          displayId = data.idno + (data.newidno && data.newidno !== data.idno ? "/" + data.newidno : (data.newidno === data.idno ? "/" + data.idno : ""));
        }

        let formattedExp = "";
        if (data.expdate && data.expdate !== "0000-00-00") {
          if (data.expdate.includes("/")) {
            const parts = data.expdate.split("/");
            if (parts.length === 3) formattedExp = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            formattedExp = data.expdate;
          }
        }

        setStock({
          product_name: data.name || "",
          id_no: displayId,
          type: data.type || "",
          location: data.location || "",
          manufacturer: cleanVal(data.manufacturer),
          source: cleanVal(data.source),
          batch_no: data.batchno || "",
          expdate: formattedExp,
          quantity: data.qty || "",
          units: data.units || "",
        });
      } else {
        toast.error("Failed to load stock details.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error connecting to server.");
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (show && id) {
      fetchStockDetail();
    }
  }, [show, id, fetchStockDetail]);

  const handleChange = (field, value) => {
    setStock((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let submitExp = stock.expdate;
      if (submitExp && submitExp.includes("-")) {
        const parts = submitExp.split("-");
        if (parts.length === 3) submitExp = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const payload = {
        manufacturer: stock.manufacturer,
        source: stock.source,
        batchno: stock.batch_no,
        expdate: submitExp,
        qty: stock.quantity,
      };

      const response = await axios.put(`/profile/department-stock-updatestock/${id}`, payload);

      if (response.data.status === "true" || response.data.status === true) {
        toast.success("Stock updated successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to update stock.");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An error occurred during update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto z-[100]">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all dark:bg-dark-700 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-dark-600 shrink-0">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-800 dark:text-dark-100">
                    Edit Stock
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto flex-1">
                  {fetching ? (
                    <div className="flex h-60 items-center justify-center">
                      <GhostSpinner className="h-8 w-8 text-primary-500" />
                    </div>
                  ) : (
                    <form id="edit-stock-form" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div className="sm:col-span-2">
                          <Input
                            label="Name"
                            value={stock.product_name}
                            disabled
                            className="bg-gray-50 text-gray-700 dark:bg-dark-900 dark:text-gray-300"
                          />
                        </div>
                        <Input
                          label="Id"
                          value={stock.id_no}
                          disabled
                          className="bg-gray-50 text-gray-700 dark:bg-dark-900 dark:text-gray-300"
                        />
                        <Input
                          label="Type"
                          value={stock.type}
                          disabled
                          className="bg-gray-50 text-gray-700 dark:bg-dark-900 dark:text-gray-300"
                        />
                        <Input
                          label="Location"
                          value={stock.location}
                          disabled
                          className="bg-gray-50 text-gray-700 dark:bg-dark-900 dark:text-gray-300"
                        />
                        <Input
                          label="Manufacturer/Source"
                          value={stock.manufacturer}
                          onChange={(e) => handleChange("manufacturer", e.target.value)}
                        />
                        <Input
                          label="Calibration Agency"
                          value={stock.source}
                          onChange={(e) => handleChange("source", e.target.value)}
                        />
                        <Input
                          label="Batch"
                          value={stock.batch_no}
                          onChange={(e) => handleChange("batch_no", e.target.value)}
                        />
                        <Input
                          label="Expiry"
                          type="date"
                          value={stock.expdate}
                          onChange={(e) => handleChange("expdate", e.target.value)}
                        />
                        <Input
                          label={`Qty(${stock.units || 'units'})`}
                          type="number"
                          value={stock.quantity}
                          onChange={(e) => handleChange("quantity", e.target.value)}
                          required
                        />
                      </div>
                    </form>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-dark-600 dark:bg-dark-800 shrink-0">
                  <Button variant="filled" color="primary" type="submit" form="edit-stock-form" disabled={loading || fetching}>
                    {loading ? "Saving..." : "Save changes"}
                  </Button>
                  <Button variant="filled" color="info" onClick={onClose} disabled={loading}>
                    Close
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
