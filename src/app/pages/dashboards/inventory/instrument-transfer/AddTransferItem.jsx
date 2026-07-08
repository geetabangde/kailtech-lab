// Import Dependencies
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

// Local Imports
import {
  Card,
  Button,
  ReactSelect as Select,
} from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function AddTransferItem() {
  const [searchParams] = useSearchParams();
  const indentId = searchParams.get("hakuna");
  const navigate = useNavigate();

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      item_name: "",
      from_location: "",
      qty: "",
      to_location: "",
    }
  });

  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState([]);
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations] = useState([]);
  const [qtyDetails, setQtyDetails] = useState(null);


  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const response = await axios.get("inventory/get-item-for-transfer", {
          params: { hakuna: indentId }
        });
        if (response.data.success || response.data.status) {
          setInstruments(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching instruments:", err);
      }
    };

    fetchInstruments();
  }, [indentId]);

  const handleItemChange = async (itemId) => {
    if (!itemId) {
      setFromLocations([]);
      setToLocations([]);
      setQtyDetails(null);
      setValue("from_location", "");
      setValue("to_location", "");
      setValue("qty", "");
      return;
    }
    // Reset downstream
    setToLocations([]);
    setQtyDetails(null);
    setValue("from_location", "");
    setValue("to_location", "");
    setValue("qty", "");

    try {
      const response = await axios.get("inventory/get-transfer-for-location", {
        params: { id: itemId }
      });
      if (response.data.success || response.data.status) {
        setFromLocations(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching from locations:", err);
    }
  };

  const handleFromLocationChange = async (locId) => {
    if (!locId) {
      setToLocations([]);
      setQtyDetails(null);
      setValue("to_location", "");
      setValue("qty", "");
      return;
    }
    setValue("to_location", "");
    setValue("qty", "");

    try {
      const response = await axios.get("inventory/get-transfer-qunatity-details", {
        params: { id: locId }
      });

      if (response.data.success || response.data.status) {
        setToLocations(response.data.locations || response.data.data || []);
        if (response.data.quantity_details) {
          setQtyDetails(response.data.quantity_details);
          if (response.data.quantity_details.input_type === 'fixed') {
             setValue("qty", response.data.quantity_details.display_qty || "1");
          } else {
             setValue("qty", "");
          }
        } else {
          setQtyDetails(null);
        }
      }
    } catch (err) {
      console.error("Error fetching to locations:", err);
    }
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      
      const payload = {
        item_name: formData.item_name?.value || formData.item_name,
        from_location: formData.from_location?.value || formData.from_location,
        to_location: formData.to_location?.value || formData.to_location,
        qty: formData.qty,
        indentid: indentId || null
      };

      const response = await axios.post("inventory/add-transfer-item", payload);

      if (response.data.success || response.data.status) {
        toast.success(response.data.message || "New Transfer has been Added successfully");
        setTimeout(() => {
          navigate("/dashboards/inventory/instrument-transfer");
        }, 1500);
      } else {
        toast.error(response.data.message || "Transfer failed");
      }
    } catch (err) {
      toast.error("An error occurred during submission");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Transfer Item">
      <div className="transition-content w-full pb-5">
        <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
              Transfer Item
            </h3>
            <div className="flex items-center gap-2">
              <Button
                component={Link}
                to={indentId ? `/dashboards/inventory/view-indent?hakuna=${indentId}` : "/dashboards/inventory/instrument-transfer"}
                color="secondary"
                variant="outline"
                size="sm"
              >
                {"<< Back"}
              </Button>
              <button type="button" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              <div className="flex flex-col gap-2">
                <Controller
                  name="item_name"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field, fieldState }) => (
                    <Select
                      {...field}
                      id="item_name"
                      label="Select Item"
                      placeholder="Choose Item to Transfer"
                      options={instruments.map(item => ({
                        value: item.id,
                        label: item.item_name || `${item.name} ${item.idno || ""}`
                      }))}
                      onChange={(val) => {
                        field.onChange(val);
                        handleItemChange(val?.value || val);
                      }}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              {/* Initial Dummy Fields to match PHP UI */}
              {!watch("item_name") && (
                <div id="instrument-location" className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Location
                    </label>
                    <Select
                      name="dummy_location"
                      isDisabled
                      placeholder=""
                      options={[]}
                      onChange={() => {}}
                    />
                  </div>
                  <div id="instrument-location">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Quantity
                      </label>
                      <input
                        type="text"
                        disabled
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none dark:border-dark-700 dark:bg-dark-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {watch("item_name") && (
                <div className="flex flex-col gap-2">
                  <Controller
                    name="from_location"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field, fieldState }) => (
                      <Select
                        {...field}
                        id="from_location"
                        label="Transfer From Location"
                        placeholder="Select From Location"
                        options={fromLocations.map(loc => ({ value: loc.id, label: loc.display_name || loc.lab_name || loc.name }))}
                        onChange={(val) => {
                          field.onChange(val);
                          handleFromLocationChange(val?.value || val);
                        }}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              )}

              {/* Dynamic Location and Quantity Section */}
              {watch("from_location") && (
                <div id="instrument-location" className="space-y-6">
                  <div id="instrument-location">
                    {qtyDetails && qtyDetails.input_type !== "fixed" && (
                      <div className="flex flex-col gap-2 mb-6">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Item Quantity (Available)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={qtyDetails.display_qty || qtyDetails.available_qty || ""}
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-gray-400"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {qtyDetails && qtyDetails.input_type !== "fixed" ? "Enter Quantity to Transfer" : "Quantity"}
                      </label>
                      <Controller
                        name="qty"
                        control={control}
                        rules={{ 
                          required: "Required",
                          validate: (value) => {
                            if (qtyDetails && qtyDetails.input_type !== "fixed") {
                              const numVal = Number(value);
                              const maxVal = Number(qtyDetails.available_qty);
                              if (isNaN(numVal) || numVal <= 0) return "Invalid quantity";
                              if (numVal > maxVal) return `Max available is ${maxVal}`;
                            }
                            return true;
                          }
                        }}
                        render={({ field, fieldState }) => (
                          <>
                            <input
                              {...field}
                              type="text"
                              readOnly={qtyDetails && qtyDetails.input_type === "fixed"}
                              className={`w-full rounded-lg border px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:text-dark-100 ${
                                qtyDetails && qtyDetails.input_type === "fixed" 
                                  ? "bg-gray-50 border-gray-200 text-gray-500 dark:bg-dark-900 dark:border-dark-700 dark:text-gray-400" 
                                  : "bg-white border-gray-300 dark:bg-dark-800"
                              } ${fieldState.error ? "border-red-500 dark:border-red-500" : ""}`}
                            />
                            {fieldState.error && <span className="text-xs text-red-500">{fieldState.error.message}</span>}
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Controller
                      name="to_location"
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field, fieldState }) => (
                        <Select
                          {...field}
                          id="to_location"
                          label="Transfer Location"
                          placeholder="Choose Location to Transfer"
                          options={toLocations.map(loc => ({ value: loc.id, label: loc.display_name || loc.lab_name || loc.name }))}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-dark-600">
                <Button
                  type="submit"
                  color="primary"
                  loading={loading}
                  className="px-8"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Page>
  );
}
