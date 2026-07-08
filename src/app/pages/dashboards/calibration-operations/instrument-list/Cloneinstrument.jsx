import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import { Page } from "components/shared/Page";
import Instrument from "./components/Instrument";
import ValidationFields from "./components/ValidationFields";
import BiomedicalFields from "./components/BiomedicalFields";
import CustomFormatFields from "./components/CustomFormatFields";
import EnvironmentalFields from "./components/EnvironmentalFields";
import PriceListSection from "./components/PriceListSection";
import AddCalibration from "./components/AddCalibration";
import AddUncertainty from "./components/AddUncertainty";
import UncertainitySetting from "./components/UncertainitySetting";

export default function CloneInstrument() {
  const navigate = useNavigate();
  const { id } = useParams(); // Original instrument ID to clone from
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(88)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [currentStep, setCurrentStep] = useState(1);
  const [savedInstrumentId, setSavedInstrumentId] = useState(null);
  const [savedFormatId, setSavedFormatId] = useState(null);
  const [savedUncertaintyId, setSavedUncertaintyId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sop: [],
    standard: [],
    typeofsupport: [],
    typeofmaster: [],
    description: "",
    discipline: [],
    groups: [],
    remark: "",
    range: "",
    leastcount: "",
    unittype: "",
    mode: "",
    supportmaster: "",
    supportrange: "",
    supportleastcount: "",
    supportunittype: "",
    supportmode: "",
    scopematrixvalidation: "",
    digitincmc: "2",
    biomedical: "No",
    showvisualtest: "No",
    showelectricalsafety: "No",
    showbasicsafety: "No",
    showperformancetest: "No",
    setpoint: "UUC",
    uuc: "1",
    master: "1",
    setpointheading: "Set Point",
    parameterheading: "",
    uucheading: "Observation On UUC",
    masterheading: "Standard Reading",
    errorheading: "Error",
    remarkheading: "Remark",
    setpointtoshow: "Yes",
    parametertoshow: "Yes",
    uuctoshow: "Yes",
    mastertoshow: "Yes",
    errortoshow: "Yes",
    remarktoshow: "Yes",
    specificationtoshow: "Yes",
    specificationheading: "",
    tempsite: "",
    tempvariablesite: "",
    humisite: "",
    humivariablesite: "",
    templab: "",
    tempvariablelab: "",
    humilab: "",
    humivariablelab: "",
    mastersincertificate: "Yes",
    uncertaintyincertificate: "Yes",
    allottolab: "",
    suffix: "",
    suffixId: "",
    uncertaintytable: [],
    uncertaintyIds: [],
    vertical: "1",
  });

  const [priceLists, setPriceLists] = useState([]);
  const [sopOptions, setSopOptions] = useState([]);
  const [standardOptions, setStandardOptions] = useState([]);
  const [disciplineOptions, setDisciplineOptions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [groupOptions, setGroupOptions] = useState([]);
  const [subcategoryOne, setSubcategoryOne] = useState([]);
  const [subcategoryTwo, setSubcategoryTwo] = useState([]);
  const [formateOptions, setFormateOptions] = useState([]);
  const [labOptions, setLabOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [modeOptions, setModeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const requiredFields = {
    name: "Instrument Name",
    sop: "Calibration Method / SOP",
    description: "Description",
    discipline: "Discipline",
    groups: "Group",
    remark: "remark",
    mode: "mode",
    range: "range",
    suffix: "suffix",
    unittype: "unittype",
    uncertaintytable: "uncertaintytable",
    tempvariablelab: "tempvariablelab",
    supportunittype: "supportunittype",
    supportrange: "supportrange",
    supportmode: "supportmode",
    supportmaster: "supportmaster",
    supportleastcount: "supportleastcount",
    specificationheading: "specificationheading",
    scopematrixvalidation: "scopematrixvalidation",
    humivariablesite: "humivariablesite",
    leastcount: "leastcount",
    humivariablelab: "The humivariablelab field is required",
    tempsite: "Temperature Range for Site",
    humisite: "Humidity Range for Site",
    templab: "Temperature Range for Lab",
    humilab: "Humidity Range for Lab",
  };

  const requiredPriceFields = {
    packagename: "Package Name",
    packagedesc: "Package Description",
    daysrequired: "Days Required",
    rate: "Rate",
  };

  // Fetch dropdown options and original instrument data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch dropdown options first
        const [
          sopRes,
          standardRes,
          subcategoryoneRes,
          subcategorytwoRes,
          formatelist,
          lablist,
          currencylist,
          unitTypeRes,
          unitRes,
          modeRes,
          disciplineRes,
        ] = await Promise.all([
          axios.get("/calibrationoperations/calibration-method-list"),
          axios.get("/calibrationoperations/calibration-standard-list"),
          axios.get("/inventory/subcategory-list"),
          axios.get("/inventory/subcategory-list"),
          axios.get("/get-formate"),
          axios.get("/master/list-lab"),
          axios.get("/master/currency-list"),
          axios.get("/master/unit-type-list"),
          axios.get("/master/units-list"),
          axios.get("/master/mode-list"),
          axios.get("/calibrationoperations/get-disciplines"),
        ]);

        const safeArray = (data) => (Array.isArray(data) ? data : []);

        setSopOptions(
          safeArray(sopRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );
        setStandardOptions(
          safeArray(standardRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );
        if (disciplineRes?.data?.data) {
          setDisciplineOptions(
            safeArray(disciplineRes.data.data).map((item) => ({
              label: item.name || item.discipline_name,
              value: (item.id || item.discipline_id || item.name)?.toString(),
            }))
          );
        }
        setSubcategoryOne(
          safeArray(subcategoryoneRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );
        setSubcategoryTwo(
          safeArray(subcategorytwoRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );

        const formattedOptions = safeArray(formatelist.data.data).map(
          (item) => ({
            label: item.name,
            value: item.description,
            id: item.id.toString(),
          })
        );
        setFormateOptions(formattedOptions);

        setLabOptions(
          safeArray(lablist.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );
        setCurrencyOptions(
          safeArray(currencylist.data.data).map((item) => ({
            label: `${item.name} (${item.description})`,
            value: item.id.toString(),
          }))
        );
        setUnitTypeOptions(
          safeArray(unitTypeRes.data.data).map((item) => ({
            label: item.name,
            value: item.name,
          }))
        );
        setUnitOptions(
          safeArray(unitRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          }))
        );
        setModeOptions(
          safeArray(modeRes.data.data).map((item) => ({
            label: item.name,
            value: item.name,
          }))
        );

        // Now fetch the original instrument data to clone
        const instrumentRes = await axios.get(
          `/calibrationoperations/get-instrument-byid/${id}`
        );

        const instrumentData = instrumentRes.data.data;
        const safeArrayData = (value) =>
          Array.isArray(value)
            ? value
            : typeof value === "string" && value
              ? value.split(",")
              : [];
        const safeString = (value) => (value != null ? String(value) : "");

        // Find matching format
        const savedSuffix = safeString(instrumentData.instrument.suffix);
        const toArray = (value) =>
          value != null && String(value).trim() !== ""
            ? String(value)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
            : [];
        const matchingFormat = formattedOptions.find(
          (opt) => opt.value === savedSuffix
        );

        // Set form data with "(Copy)" appended to name
        setFormData((prev) => ({
          ...prev,
          name: `${safeString(instrumentData.instrument.name)} (Copy)`,
          sop: safeArrayData(instrumentData.instrument.sop),
          standard: safeArrayData(instrumentData.instrument.standard),
          typeofsupport: safeArrayData(instrumentData.instrument.typeofsupport),
          typeofmaster: safeArrayData(instrumentData.instrument.typeofmaster),
          description: safeString(instrumentData.instrument.description),
          discipline: toArray(instrumentData.instrument.discipline),
          groups: toArray(instrumentData.instrument.groups),
          remark: safeString(instrumentData.instrument.remark),
          range: safeString(instrumentData.instrument.range),
          leastcount: safeString(instrumentData.instrument.leastcount),
          unittype: safeString(instrumentData.instrument.unittype),
          mode: safeString(instrumentData.instrument.mode),
          supportmaster: safeString(instrumentData.instrument.supportmaster),
          supportrange: safeString(instrumentData.instrument.supportrange),
          supportleastcount: safeString(
            instrumentData.instrument.supportleastcount
          ),
          supportunittype: safeString(instrumentData.instrument.supportunittype),
          supportmode: safeString(instrumentData.instrument.supportmode),
          scopematrixvalidation: safeString(
            instrumentData.instrument.scopematrixvalidation
          ),
          digitincmc: safeString(instrumentData.instrument.digitincmc || "2"),
          biomedical: safeString(instrumentData.instrument.biomedical || "No"),
          showvisualtest: safeString(
            instrumentData.instrument.showvisualtest || "No"
          ),
          showelectricalsafety: safeString(
            instrumentData.instrument.showelectricalsafety || "No"
          ),
          showbasicsafety: safeString(
            instrumentData.instrument.showbasicsafety || "No"
          ),
          showperformancetest: safeString(
            instrumentData.instrument.showperformancetest || "No"
          ),
          setpoint: safeString(instrumentData.instrument.setpoint || "UUC"),
          uuc: safeString(instrumentData.instrument.uuc || "1"),
          master: safeString(instrumentData.instrument.master || "1"),
          setpointheading: safeString(
            instrumentData.instrument.setpointheading || "Set Point"
          ),
          parameterheading: safeString(
            instrumentData.instrument.parameterheading || ""
          ),
          uucheading: safeString(
            instrumentData.instrument.uucheading || "Observation On UUC"
          ),
          masterheading: safeString(
            instrumentData.instrument.masterheading || "Standard Reading"
          ),
          errorheading: safeString(
            instrumentData.instrument.errorheading || "Error"
          ),
          remarkheading: safeString(
            instrumentData.instrument.remarkheading || "Remark"
          ),
          setpointtoshow: safeString(
            instrumentData.instrument.setpointtoshow || "Yes"
          ),
          parametertoshow: safeString(
            instrumentData.instrument.parametertoshow || "Yes"
          ),
          uuctoshow: safeString(instrumentData.instrument.uuctoshow || "Yes"),
          mastertoshow: safeString(
            instrumentData.instrument.mastertoshow || "Yes"
          ),
          errortoshow: safeString(
            instrumentData.instrument.errortoshow || "Yes"
          ),
          remarktoshow: safeString(
            instrumentData.instrument.remarktoshow || "Yes"
          ),
          specificationtoshow: safeString(
            instrumentData.instrument.specificationtoshow || "Yes"
          ),
          specificationheading: safeString(
            instrumentData.instrument.specificationheading || ""
          ),
          tempsite: safeString(instrumentData.instrument.tempsite),
          tempvariablesite: safeString(
            instrumentData.instrument.tempvariablesite
          ),
          humisite: safeString(instrumentData.instrument.humisite),
          humivariablesite: safeString(
            instrumentData.instrument.humivariablesite
          ),
          templab: safeString(instrumentData.instrument.templab),
          tempvariablelab: safeString(instrumentData.instrument.tempvariablelab),
          humilab: safeString(instrumentData.instrument.humilab),
          humivariablelab: safeString(instrumentData.instrument.humivariablelab),
          mastersincertificate: safeString(
            instrumentData.instrument.mastersincertificate || "Yes"
          ),
          uncertaintyincertificate: safeString(
            instrumentData.instrument.uncertaintyincertificate || "Yes"
          ),
          allottolab: safeString(instrumentData.instrument.allottolab),
          suffix: savedSuffix,
          suffixId: matchingFormat ? matchingFormat.id : "",
          uncertaintytable: safeArrayData(
            instrumentData.instrument.uncertaintytable
          ),
          vertical: safeString(instrumentData.instrument.vertical || "1"),
        }));

        // Handle uncertainty IDs
        const uncertaintyData = safeArrayData(
          instrumentData.instrument.uncertaintytable
        );
        if (uncertaintyData && uncertaintyData.length > 0) {
          const matchingUncertainties = formattedOptions.filter((opt) =>
            uncertaintyData.includes(opt.value)
          );

          if (matchingUncertainties.length > 0) {
            const uncertaintyIds = matchingUncertainties.map((u) =>
              parseInt(u.id, 10)
            );
            setFormData((prev) => ({
              ...prev,
              uncertaintyIds: uncertaintyIds,
            }));
          }
        }

        // Clone price lists (remove IDs to create new entries)
        const priceMatrix = Array.isArray(instrumentData.pricematrix)
          ? instrumentData.pricematrix
          : [];
        const clonedPriceLists =
          priceMatrix.length > 0
            ? priceMatrix.map((price) => ({
              // Remove id to create new entry
              packagename: safeString(price.packagename),
              packagedesc: safeString(price.packagedesc),
              accreditation: safeString(price.accreditation),
              location: safeString(price.location),
              currency:
                currencyOptions.find(
                  (opt) => opt.value === safeString(price.currency)
                ) || null,
              rate: safeString(price.rate),
              daysrequired: safeString(price.daysrequired),
              matrices:
                Array.isArray(price.matrix) && price.matrix.length > 0
                  ? price.matrix.map((matrix, matrixIndex) => ({
                    // Remove id to create new entry
                    matrixno: matrixIndex + 1,
                    unittype: safeString(matrix.unittype),
                    unit: safeString(matrix.unit),
                    mode: safeString(matrix.mode),
                    instrangemin: safeString(matrix.instrangemin),
                    instrangemax: safeString(matrix.instrangemax),
                    tolerance: safeString(matrix.tolerance),
                    tolerancetype: safeString(matrix.tolerancetype),
                  }))
                  : [],
            }))
            : [];

        setPriceLists(clonedPriceLists);

        toast.success("Instrument data loaded for cloning");
      } catch (err) {
        toast.error("Error loading instrument data");
        console.error("Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, currencyOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleMultiSelectChange = (selectedOptions, name) => {
    if (name === "suffix") {
      const selectedValue = selectedOptions ? selectedOptions.value : "";
      const selectedId = selectedOptions ? selectedOptions.id : "";

      setFormData((prev) => ({
        ...prev,
        [name]: selectedValue,
        suffixId: selectedId,
      }));
    } else if (name === "uncertaintytable") {
      const selectedValues = selectedOptions
        ? selectedOptions.map((opt) => opt.value)
        : [];
      const selectedIds = selectedOptions
        ? selectedOptions.map((opt) => opt.id)
        : [];

      setFormData((prev) => ({
        ...prev,
        [name]: selectedValues,
        uncertaintyIds: selectedIds,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSingleSelectChange = (selectedOption, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption?.value || "",
    }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handlePriceListChange = (index, e) => {
    const { name, value } = e.target;
    setPriceLists((prev) => {
      const updated = [...prev];
      updated[index][name] = value;
      return updated;
    });
    if (errors[`price_${index}_${name}`]) {
      setErrors((prev) => ({ ...prev, [`price_${index}_${name}`]: false }));
    }
  };

  const handlePriceCurrencyChange = (selected, index) => {
    setPriceLists((prev) => {
      const updated = [...prev];
      updated[index].currency = selected;
      return updated;
    });
  };

  const handleMatrixChange = (priceIndex, matrixIndex, e) => {
    const { name, value } = e.target;
    setPriceLists((prev) => {
      const updated = [...prev];
      updated[priceIndex].matrices[matrixIndex][name] = value;
      return updated;
    });
  };

  const addMatrix = useCallback((priceIndex) => {
    setPriceLists((prev) => {
      const updated = [...prev];
      const selectedPrice = { ...updated[priceIndex] };
      const newMatrices = [...(selectedPrice.matrices || [])];

      const newMatrix = {
        unittype: "",
        unit: "",
        mode: "",
        instrangemin: "",
        instrangemax: "",
        tolerance: "",
        tolerancetype: "",
      };

      if (
        newMatrices.length > 0 &&
        JSON.stringify(newMatrices[newMatrices.length - 1]) ===
        JSON.stringify(newMatrix)
      ) {
        return prev;
      }

      newMatrices.push(newMatrix);
      selectedPrice.matrices = newMatrices;
      updated[priceIndex] = selectedPrice;
      return updated;
    });
  }, []);

  const removeMatrix = (priceIndex, matrixIndex) => {
    setPriceLists((prev) => {
      const updated = [...prev];
      updated[priceIndex].matrices = updated[priceIndex].matrices.filter(
        (_, i) => i !== matrixIndex
      );
      return updated;
    });
  };

  const addPriceList = () => {
    setPriceLists((prev) => [
      ...prev,
      {
        packagename: "",
        packagedesc: "",
        accreditation: "Non Nabl",
        location: "Site",
        currency: null,
        rate: "",
        daysrequired: "",
        matrices: [],
      },
    ]);
  };

  const removePriceList = (index) => {
    setPriceLists((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(requiredFields).forEach((field) => {
      const value = formData[field];
      const isArray = Array.isArray(value);
      const isEmptyArray = isArray && value.length === 0;
      const isEmptyString =
        typeof value === "string" && value.toString().trim() === "";

      if (field === "sop" || field === "discipline" || field === "groups") {
        if (isEmptyArray || value == null) {
          newErrors[field] = true;
        }
      } else {
        if (isEmptyArray || isEmptyString || value == null) {
          newErrors[field] = true;
        }
      }
    });

    priceLists.forEach((price, index) => {
      Object.keys(requiredPriceFields).forEach((field) => {
        if (!price[field] || price[field].toString().trim() === "") {
          newErrors[`price_${index}_${field}`] = true;
        }
      });
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      let element;

      if (firstErrorField.startsWith("price_")) {
        const fieldParts = firstErrorField.split("_");
        const fieldName = fieldParts[2];
        element = document.querySelector(`input[name="${fieldName}"]`);
      } else {
        element = document.querySelector(`[name="${firstErrorField}"]`);
      }

      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  };

  // Clone instrument - Save as new
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        discipline: Array.isArray(formData.discipline)
          ? formData.discipline.join(",")
          : formData.discipline || "",
        groups: Array.isArray(formData.groups)
          ? formData.groups.join(",")
          : formData.groups || "",
        suffix: Array.isArray(formData.suffix)
          ? formData.suffix[0] || ""
          : formData.suffix || "",
        uncertaintytable: Array.isArray(formData.uncertaintytable)
          ? formData.uncertaintytable[0] || ""
          : formData.uncertaintytable || "",
        packagename: [],
        packagedesc: [],
        pricematrix: [],
        accreditationpricelist: [],
        locationpricelist: [],
        daysrequiredpricelist: [],
        ratepricelist: [],
        currencypricelist: [],
      };

      priceLists.forEach((price, priceIndex) => {
        payload.pricematrix.push(priceIndex);
        payload.packagename.push(price.packagename);
        payload.packagedesc.push(price.packagedesc);
        payload.accreditationpricelist.push(price.accreditation);
        payload.locationpricelist.push(price.location);
        payload.daysrequiredpricelist.push(price.daysrequired);
        payload.ratepricelist.push(price.rate);
        payload.currencypricelist.push(price.currency?.value || "");

        price.matrices.forEach((matrix, matrixIndex) => {
          const prefix = `${priceIndex}`;

          payload[`matrixno${prefix}`] = payload[`matrixno${prefix}`] || [];
          payload[`unittype${prefix}`] = payload[`unittype${prefix}`] || [];
          payload[`unit${prefix}`] = payload[`unit${prefix}`] || [];
          payload[`mode${prefix}`] = payload[`mode${prefix}`] || [];
          payload[`instrangemin${prefix}`] =
            payload[`instrangemin${prefix}`] || [];
          payload[`instrangemax${prefix}`] =
            payload[`instrangemax${prefix}`] || [];
          payload[`tolerance${prefix}`] = payload[`tolerance${prefix}`] || [];
          payload[`tolerancetype${prefix}`] =
            payload[`tolerancetype${prefix}`] || [];

          payload[`matrixno${prefix}`].push(matrixIndex + 1);
          payload[`unittype${prefix}`].push(matrix.unittype);
          payload[`unit${prefix}`].push(matrix.unit);
          payload[`mode${prefix}`].push(matrix.mode);
          payload[`instrangemin${prefix}`].push(matrix.instrangemin);
          payload[`instrangemax${prefix}`].push(matrix.instrangemax);
          payload[`tolerance${prefix}`].push(matrix.tolerance);
          payload[`tolerancetype${prefix}`].push(matrix.tolerancetype);
        });
      });

      console.log("CLONE Payload:", payload);

      const response = await axios.post(
        "/calibrationoperations/add-new-instrument",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("=== CLONE API RESPONSE ===");
      console.log("Response Data:", response.data);

      const instrumentId = response.data?.instid;
      const formatId = formData.suffixId || null;
      const uncertaintyId = formData.uncertaintyIds?.[0] || null;

      if (instrumentId && formatId) {
        const finalInstrumentId =
          typeof instrumentId === "string"
            ? parseInt(instrumentId, 10)
            : instrumentId;

        const finalFormatId = parseInt(formatId, 10);

        if (
          !isNaN(finalInstrumentId) &&
          finalInstrumentId > 0 &&
          !isNaN(finalFormatId) &&
          finalFormatId > 0
        ) {
          setSavedInstrumentId(finalInstrumentId);
          setSavedFormatId(finalFormatId);

          if (uncertaintyId) {
            const finalUncertaintyId = parseInt(uncertaintyId, 10);
            if (!isNaN(finalUncertaintyId) && finalUncertaintyId > 0) {
              setSavedUncertaintyId(finalUncertaintyId);
            }
          }

          toast.success("Instrument cloned successfully! Moving to Step 2...");

          setTimeout(() => {
            setCurrentStep(2);
          }, 100);
        } else {
          toast.error("Invalid data received. Please try again.");
        }
      } else {
        if (!instrumentId) {
          toast.error("Instrument ID not received from server");
        }
        if (!formatId) {
          toast.error("Please select a Format before proceeding");
        }
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error(err.response?.data?.message || "Error cloning instrument");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6 flex items-center justify-center">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${currentStep >= step
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"
                }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`h-1 w-16 ${currentStep > step ? "bg-blue-600" : "bg-gray-300"
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading && !formData.name) {
    return (
      <Page title="Clone Instrument">
        <div className="p-6">
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 animate-spin text-blue-600"
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
              <span>Loading instrument data for cloning...</span>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Clone Instrument">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {currentStep === 1 && "Step 1: Clone Instrument (Modify as needed)"}
            {currentStep === 2 && "Step 2: Calibration Results Settings"}
            {currentStep === 3 && "Step 3: "}
            {currentStep === 4 && "Step 4: Uncertainity Settings"}
          </h2>
          <Button
            variant="outlined"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() =>
              navigate("/dashboards/calibration-operations/instrument-list")
            }
          >
            Back to List
          </Button>
        </div>
        {renderStepIndicator()}

        {/* Step 1: Clone Instrument Form */}
        {currentStep === 1 && (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Instrument
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleMultiSelectChange={handleMultiSelectChange}
              sopOptions={sopOptions}
              standardOptions={standardOptions}
              disciplineOptions={disciplineOptions}
              groupOptions={groupOptions}
            />

            <ValidationFields
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleMultiSelectChange={handleMultiSelectChange}
              subcategoryOne={subcategoryOne}
              subcategoryTwo={subcategoryTwo}
            />

            <BiomedicalFields
              formData={formData}
              handleInputChange={handleInputChange}
            />

            <CustomFormatFields
              formData={formData}
              handleInputChange={handleInputChange}
            />

            <EnvironmentalFields
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleSingleSelectChange={handleSingleSelectChange}
              handleMultiSelectChange={handleMultiSelectChange}
              labOptions={labOptions}
              formateOptions={formateOptions}
            />

            <PriceListSection
              priceLists={priceLists}
              errors={errors}
              currencyOptions={currencyOptions}
              unitTypeOptions={unitTypeOptions}
              unitOptions={unitOptions}
              modeOptions={modeOptions}
              handlePriceListChange={handlePriceListChange}
              handlePriceCurrencyChange={handlePriceCurrencyChange}
              handleMatrixChange={handleMatrixChange}
              removeMatrix={removeMatrix}
              addMatrix={addMatrix}
              removePriceList={removePriceList}
            />

            <div className="col-span-1 md:col-span-2">
              <Button
                type="button"
                onClick={addPriceList}
                className="bg-green-600 hover:bg-green-700"
              >
                + Add Price List
              </Button>
            </div>

            <div className="col-span-1 md:col-span-2">
              <Button type="submit" color="primary" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin text-white"
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
                    Cloning...
                  </div>
                ) : (
                  "Clone & Continue"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Calibration Settings */}
        {currentStep === 2 && (
          <div>
            {savedInstrumentId && savedFormatId ? (
              <AddCalibration
                instid={savedInstrumentId}
                instrumentId={savedInstrumentId}
                formatId={savedFormatId}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-red-600">
                  Error: {!savedInstrumentId ? "Instrument ID" : "Format ID"}{" "}
                  not found. Please go back and try again.
                </p>
                <Button onClick={() => setCurrentStep(1)} className="mt-4">
                  Go Back to Step 1
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Uncertainty Settings */}
        {currentStep === 3 && (
          <div>
            {savedInstrumentId && savedFormatId ? (
              <AddUncertainty
                instid={savedInstrumentId}
                instrumentId={savedInstrumentId}
                formatId={savedFormatId}
                uncertaintyId={savedUncertaintyId}
                onComplete={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-red-600">
                  Error: {!savedInstrumentId ? "Instrument ID" : "Format ID"}{" "}
                  not found. Please start from Step 1.
                </p>
                <Button onClick={() => setCurrentStep(1)} className="mt-4">
                  Go Back to Step 1
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Uncertainity */}
        {currentStep === 4 && (
          <div>
            {savedInstrumentId && savedFormatId ? (
              <UncertainitySetting
                instid={savedInstrumentId}
                formatId={savedFormatId}
                formatValue={formData.suffix}
                onComplete={() => {
                  toast.success("Instrument cloned successfully!");
                  navigate(
                    "/dashboards/calibration-operations/instrument-list"
                  );
                }}
                onBack={() => setCurrentStep(3)}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-red-600">
                  Error: {!savedInstrumentId ? "Instrument ID" : "Format ID"}{" "}
                  not found. Please start from Step 1.
                </p>
                <Button onClick={() => setCurrentStep(1)} className="mt-4">
                  Go Back to Step 1
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}
