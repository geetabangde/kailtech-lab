import { useState, useEffect } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import ReactSelect from "react-select";

export function ChooseGateItem({ show, onClose, row, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (show && row?.original?.id) {
      fetchEmployees();
      setSelectedPerson("");
      fetchItemDetails();
    }
  }, [show, row]);

  const fetchItemDetails = async () => {
    try {
      setLoadingDetails(true);
      const res = await axios.get(`/gate-entry/gate-entry-by-id/${row.original.id}`);
      if (res.data.status && res.data.data) {
        setItemDetails(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch item details", err);
      toast.error("Failed to fetch gate entry details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const res = await axios.get("hrm/get-users-name");
      if (res.data.status && Array.isArray(res.data.data)) {
        setEmployees(res.data.data.map(emp => ({ value: emp.id, label: emp.name })));
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPerson) {
      toast.error("Please select a person.");
      return;
    }

    setLoading(true);
    try {
      // The original php submitted to issuegateitem.php with allotedto and the id (hakuna)
      const payload = {
        id: row.original.id,
        allotedto: selectedPerson,
      };

      const res = await axios.post("/gate-entry/issue-gate-item", payload);

      if (res.data.status) {
        toast.success(res.data.message || "Item issued successfully");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to issue item");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while issuing the item.");
    } finally {
      setLoading(false);
    }
  };

  if (!row) return null;

  return (
    <Transition appear show={show} as={Dialog} onClose={loading ? () => { } : onClose} className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5">
      <TransitionChild as="div" enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0" className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40" />

      <TransitionChild as={DialogPanel} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0" className="scrollbar-sm relative flex w-full max-w-md flex-col overflow-y-auto rounded-lg bg-white px-6 py-6 text-left transition-opacity duration-300 dark:bg-dark-700 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
          Issue Item To People
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
            <div className="mt-1 p-2 bg-gray-100 rounded-md dark:bg-dark-800 text-sm">
              {loadingDetails ? "Loading..." : itemDetails?.purpose_name || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <div className="mt-1 p-2 bg-gray-100 rounded-md dark:bg-dark-800 text-sm">
              {loadingDetails ? "Loading..." : itemDetails?.description || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
            <div className="mt-1 p-2 bg-gray-100 rounded-md dark:bg-dark-800 text-sm">
              {loadingDetails ? "Loading..." : itemDetails?.source || "N/A"}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Choose Person</label>
            <ReactSelect
              options={employees}
              value={employees.find((p) => p.value == selectedPerson) || null}
              onChange={(selected) => setSelectedPerson(selected ? selected.value : "")}
              placeholder={fetchingEmployees ? "Loading..." : "Select Person"}
              isClearable
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

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button color="primary" type="submit" className="space-x-2" disabled={loading}>
              <span>Issue Item</span>
            </Button>
          </div>
        </form>
      </TransitionChild>
    </Transition>
  );
}

ChooseGateItem.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func,
  row: PropTypes.object,
  onSuccess: PropTypes.func,
};
