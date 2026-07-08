import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import axios from "utils/axios";
import { Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import ReactSelect from "react-select";

export function LocateInstrumentModal({ isOpen, onClose, instruments, onSuccess }) {
  const [labs, setLabs] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLabs();
      
      const initialData = instruments.map((inst) => ({
        ...inst,
        transferqty: inst.qty,
        transferlocation: "",
      }));
      setAllocations(initialData);
    }
  }, [isOpen, instruments]);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/master/list-lab");
      if (response.data.status && Array.isArray(response.data.data)) {
        setLabs(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching labs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...allocations];
    updated[index][field] = value;
    setAllocations(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < allocations.length; i++) {
      const item = allocations[i];
      if (!item.transferlocation) {
        alert(`Please select a transfer location for ${item.name}`);
        return;
      }
      const qty = Number(item.transferqty);
      const maxQty = Number(item.qty);
      if (isNaN(qty) || qty < 1 || qty > maxQty) {
        alert(`Invalid transfer quantity for ${item.name}. Must be between 1 and ${maxQty}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      // Format payload to match PHP array inputs
      const payload = {
        id: allocations.map((a) => a.id),
        availableqty: allocations.map((a) => a.qty),
        transferqty: allocations.map((a) => a.transferqty),
        tranferlocation: allocations.map((a) => a.transferlocation), // spelled "tranferlocation" in PHP
        typeofuse: allocations.map((a) => a.typeofuse),
        locationid: allocations.map((a) => a.locationid),
      };

      const response = await axios.post("inventory/transfer-Material-tolocation", payload);
      
      if (response.data.success || response.data.status === true || response.data.status === "true") {
        alert(response.data.message || "Transfer Of Item successfully");
        onSuccess();
        onClose();
      } else {
        alert(response.data.message || "Failed to locate instruments.");
      }
    } catch (err) {
      console.error("Error locating instruments:", err);
      const errorMessage = err.response?.data?.message || "Failed to locate instruments.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={onClose}>
        <TransitionChild
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
        />

        <TransitionChild
          as={DialogPanel}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
          className="fixed inset-x-0 bottom-0 top-10 flex w-full flex-col rounded-t-xl bg-white pb-4 transition-transform duration-200 dark:bg-dark-700 sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[90vh] sm:max-w-5xl sm:rounded-xl sm:pb-0"
        >
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:px-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
              Locate Instrument
            </h3>
            <Button
              onClick={onClose}
              variant="flat"
              isIcon
              className="size-8 rounded-full"
            >
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          <div className="grow overflow-auto p-4 sm:p-6">
            <form id="locateinstrument" onSubmit={handleSubmit}>
              <Table className="w-full text-left text-sm [&_.table-td]:py-2">
                <THead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Idno</Th>
                    <Th>Batch no</Th>
                    <Th>UOM</Th>
                    <Th>Available Qty</Th>
                    <Th>Transfer Quantity</Th>
                    <Th>Transfer Location</Th>
                  </Tr>
                </THead>
                <TBody>
                  {allocations.map((row, index) => {
                    const isReadOnly = String(row.typeofuse) === "2";
                    return (
                      <Tr key={row.id}>
                        <Td className="whitespace-normal">{row.name}</Td>
                        <Td className="whitespace-normal break-all">{row.idno}</Td>
                        <Td>{row.batchno}</Td>
                        <Td>{row.unit}</Td>
                        <Td>
                          <input
                            type="text"
                            value={row.qty}
                            readOnly
                            className="w-24 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-600"
                          />
                        </Td>
                        <Td>
                          <input
                            type="number"
                            min="1"
                            max={row.qty}
                            value={row.transferqty}
                            readOnly={isReadOnly}
                            onChange={(e) => handleChange(index, "transferqty", e.target.value)}
                            className={`w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-600 ${isReadOnly ? 'bg-gray-100 dark:bg-dark-800' : ''}`}
                            required
                          />
                        </Td>
                        <Td>
                          <div className="min-w-[160px]">
                            <ReactSelect
                              name={`location_${index}`}
                              options={labs.map(lab => ({ label: lab.name, value: lab.id }))}
                              value={labs.map(lab => ({ label: lab.name, value: lab.id })).find(opt => opt.value === row.transferlocation) || null}
                              onChange={(option) => handleChange(index, "transferlocation", option ? option.value : "")}
                              placeholder="Select"
                              isSearchable={true}
                              menuPosition="fixed"
                              menuPortalTarget={document.body}
                              styles={{
                                menuPortal: base => ({ ...base, zIndex: 9999 }),
                                control: base => ({ ...base, minHeight: '34px' })
                              }}
                            />
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4 dark:border-dark-500 sm:px-6">
            <Button onClick={onClose} variant="outline" color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              color="primary"
              disabled={loading || submitting || allocations.length === 0}
            >
              {submitting ? "Submitting..." : "Submit Location"}
            </Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
