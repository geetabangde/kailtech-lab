import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import PropTypes from "prop-types";
import { useRef, useState, useEffect } from "react";
import axios from "utils/axios";
import { Button } from "components/ui";

import Select from "react-select";

export function ReassignChemistModal({ show, onClose, row }) {
  const focusRef = useRef();
  const [chemists, setChemists] = useState([]);
  const [selectedChemist, setSelectedChemist] = useState("");
  const [loading, setLoading] = useState(false);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "40px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
      },
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 })
  };

  useEffect(() => {
    if (show) {
      // In PHP: selectextrawhere("admin", "status=1 and FIND_IN_SET(id ,(select users from labs where id=$depart))")
      const fetchChemists = async () => {
        try {
          const res = await axios.get("/people/get-admin-users", { params: { status: 1 } });
          setChemists(res.data?.data || []);
        } catch (err) {
          console.error("Error fetching chemists:", err);
        }
      };
      fetchChemists();
    } else {
      setSelectedChemist("");
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChemist) return;
    try {
      setLoading(true);
      // TODO: Connect this to the actual API endpoint when available
      console.log("Updated chemist for id:", row?.original?.id, "to:", selectedChemist);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={show} as={Dialog} initialFocus={focusRef} onClose={onClose} className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden px-4 py-6 sm:px-5">
      <TransitionChild
        as="div"
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
      />
      <TransitionChild
        as={DialogPanel}
        enter="ease-out duration-300"
        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        enterTo="opacity-100 translate-y-0 sm:scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        className="relative w-full max-w-lg rounded-lg bg-white px-6 py-6 text-left shadow-xl transition-all dark:bg-dark-700"
      >
        <h3 className="text-xl font-medium leading-6 text-gray-900 dark:text-white mb-4">
          Reassign Chemist
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name Of Parameter
            </label>
            <input 
              type="text" 
              readOnly 
              value={row?.original?.parameter || ""} 
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-white"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assigned Chemist
            </label>
            <input 
              type="text" 
              readOnly 
              value={row?.original?.chemist || ""} 
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-white"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Choose Chemist
            </label>
            <Select
              required
              options={chemists.map((c) => ({
                value: String(c.id),
                label: `${c.firstname || ""} ${c.lastname || ""}`.trim() || String(c.id),
              }))}
              value={
                selectedChemist
                  ? {
                      value: String(selectedChemist),
                      label: (() => {
                        const found = chemists.find((c) => String(c.id) === String(selectedChemist));
                        return found
                          ? `${found.firstname || ""} ${found.lastname || ""}`.trim()
                          : String(selectedChemist);
                      })(),
                    }
                  : null
              }
              onChange={(option) => setSelectedChemist(option ? option.value : "")}
              isClearable
              isSearchable
              placeholder="Select Person"
              classNamePrefix="react-select"
              className="w-full text-sm"
              styles={selectStyles}
              menuPosition="fixed"
              menuPortalTarget={document.body}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="primary" ref={focusRef}>
              {loading ? "Updating..." : "Update Chemist"}
            </Button>
          </div>
        </form>
      </TransitionChild>
    </Transition>
  );
}

ReassignChemistModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  row: PropTypes.object.isRequired,
};
