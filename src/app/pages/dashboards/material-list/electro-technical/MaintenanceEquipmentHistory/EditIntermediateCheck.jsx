import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import axios from "utils/axios";
import { Button, Card } from "components/ui";
import Select from "react-select";
import toast from "react-hot-toast"; // ✅ Toast import

export default function EditIntermediateCheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const index = searchParams.get('index');
  const fid = searchParams.get('fid');
  const cid = searchParams.get('cid');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    instid: "",
    validityid: "",
    year: "",
    selectedMonths: [],
    instrumentName: ""
  });

  // Month options for dropdown
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Fetch existing data
  useEffect(() => {
    const fetchRecordData = async () => {
      try {
        setLoading(true);
        
        // API call to get specific record data
        const response = await axios.get(
          `/material/intermidiatecheck-planner-view`,
          {
            params: {
              index: index,
            },
          }
        );

        console.log("📥 API Response:", response.data);

        if (response.data && response.data.success) {
          const record = response.data.data.find(item => item.index === parseInt(index));
          
          console.log("🔍 Found Record:", record);
          
          if (record) {
            // Extract selected months from the months object
            const selectedMonths = Object.keys(record.months || {})
              .filter(key => record.months[key])
              .map(key => parseInt(key));

            // ✅ Try different possible field names for validityid
            const validityId = record.validityid || 
                              record.validity_id || 
                              record.validityId || 
                              record.id || 
                              record.index || 
                              "";

            console.log("✅ Extracted validityId:", validityId);

            setFormData({
              instid: record.index || record.instid || "",
              validityid: validityId,
              year: record.year || "",
              selectedMonths: selectedMonths,
              instrumentName: record.name || ""
            });

            console.log("📋 Form Data Set:", {
              instid: record.index || record.instid || "",
              validityid: validityId,
              year: record.year || "",
              selectedMonths: selectedMonths,
              instrumentName: record.name || ""
            });
          }
        }
      } catch (err) {
        console.error("❌ Error fetching record data:", err);
        toast.error("Failed to load data"); // ✅ Toast error
      } finally {
        setLoading(false);
      }
    };

    if (index) {
      fetchRecordData();
    }
  }, [index]);

  // Handle month selection
  const handleMonthChange = (selectedOptions) => {
    const months = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({
      ...prev,
      selectedMonths: months
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedMonths.length === 0) {
      toast.error("Please select at least one month"); // ✅ Toast error
      return;
    }

    // ✅ Validation before submission
    if (!formData.validityid) {
      toast.error("Validity ID is missing. Please contact support."); // ✅ Toast error
      console.error("❌ Missing validityid:", formData);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        instid: parseInt(formData.instid) || formData.instid,
        validityid: parseInt(formData.validityid) || formData.validityid,
        year: parseInt(formData.year),
        month: formData.selectedMonths
      };

      console.log("📤 Sending Payload:", payload);

      const response = await axios.post(
        `/material/update-intermediatecheck`,
        payload
      );

      console.log("📥 Update Response:", response.data);

      if (response.data && response.data.success) {
        toast.success("Intermediate check updated successfully!"); // ✅ Toast success
        setTimeout(() => {
          handleBack();
        }, 1000); // 1 second delay taaki toast dikh sake
      } else {
        toast.error("Failed to update intermediate check"); // ✅ Toast error
      }
    } catch (err) {
      console.error("❌ Error updating intermediate check:", err);
      console.error("Error details:", err.response?.data);
      
      // ✅ Better error handling with toast
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.validityid?.[0] ||
                          "Error updating intermediate check. Please try again.";
      toast.error(errorMessage); // ✅ Toast error
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/dashboards/material-list/electro-technical/maintenance-equipment-history/view-imc?fid=${fid}&cid=${cid}`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg
          className="animate-spin h-6 w-6 mr-2 text-blue-600"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
          ></path>
        </svg>
        Loading...
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 px-[var(--margin-x)] py-4">
      <div className="flex items-center justify-between space-x-4 mb-4">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="text-2xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Edit Intermediate Check
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-8 space-x-1.5 rounded-md px-3 text-xs"
            color="secondary"
            onClick={handleBack}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back</span>
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year Field */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="text"
              value={formData.year}
              readOnly
              className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Instrument Name Field */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Instrument Name
            </label>
            <input
              type="text"
              value={formData.instrumentName}
              readOnly
              className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Month Multi-Select */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label className="text-sm font-medium text-gray-700 pt-2">
              Month
            </label>
            <Select
              isMulti
              value={monthOptions.filter(option => 
                formData.selectedMonths.includes(option.value)
              )}
              onChange={handleMonthChange}
              options={monthOptions}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select months..."
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#d1d5db',
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#3b82f6',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: 'white',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: 'white',
                  ':hover': {
                    backgroundColor: '#2563eb',
                    color: 'white',
                  },
                }),
              }}
            />
          </div>

          {/* Submit Button */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <div></div>
            <Button
              type="submit"
              className="px-6 py-2 rounded-md text-sm font-medium w-fit"
              color="primary"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}