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
// import AddUncertainty from "./components/AddUncertainty";
import UncertainitySetting from "./components/UncertainitySetting";
import CertificateSetting from "./components/CertificateSetting";
export default function EditCalibrationInstrumnet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(88)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [currentStep, setCurrentStep] = useState(1);
  const [savedFormatId, setSavedFormatId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [savedUncertaintyId, setSavedUncertaintyId] = useState(null);
  const [savedInstrumentId, setSavedInstrumentId] = useState(null);

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
  const [disciplineOptions] = useState([]);
  const [groupOptions] = useState([]);
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

  // Required fields
  const requiredFields = {
    name: "Instrument Name",
    sop: "Calibration Method/SOP",
    description: "Description",
    discipline: "Discipline",
    groups: "Group",
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

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        if (id) {
          const instrumentIdFromUrl =
            typeof id === "string" ? parseInt(id, 10) : id;
          if (!isNaN(instrumentIdFromUrl) && instrumentIdFromUrl > 0) {
            setSavedInstrumentId(instrumentIdFromUrl);
            console.log("✅ Set Instrument ID from URL:", instrumentIdFromUrl);
          }
        }

        // ✅ STEP 1: First fetch all dropdown options
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
        ]);

        const safeArray = (data) => (Array.isArray(data) ? data : []);

        // ✅ STEP 2: Set all dropdown options FIRST
        setSopOptions(
          safeArray(sopRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
        );
        setStandardOptions(
          safeArray(standardRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
        );
        setSubcategoryOne(
          safeArray(subcategoryoneRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
        );
        setSubcategoryTwo(
          safeArray(subcategorytwoRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
        );

        // ✅ Store formatted options in a variable
        const formattedOptions = safeArray(formatelist.data.data).map(
          (item) => ({
            label: item.name,
            value: item.description,
            id: item.id.toString(),
          }),
        );

        setFormateOptions(formattedOptions);
        console.log("✅ Format Options Set:", formattedOptions);

        setLabOptions(
          safeArray(lablist.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
        );
        const mappedCurrencies = safeArray(currencylist.data.data).map((item) => ({
          label: `${item.name} (${item.description})`,
          value: item.id.toString(),
        }));
        setCurrencyOptions(mappedCurrencies);
        setUnitTypeOptions(
          safeArray(unitTypeRes.data.data).map((item) => ({
            label: item.name,
            value: item.name,
          })),
        );
        setUnitOptions(
          safeArray(unitRes.data.data).map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
        );
        setModeOptions(
          safeArray(modeRes.data.data).map((item) => ({
            label: item.name,
            value: item.name,
          })),
        );

        // ✅ STEP 3: NOW fetch instrument data AFTER options are ready
        const instrumentRes = await axios.get(
          `/calibrationoperations/get-instrument-byid/${id}`,
        );

        const instrumentData = instrumentRes.data.data;

        console.log("=== DEBUGGING SUFFIX DATA ===");
        console.log("📌 Suffix from API:", instrumentData.instrument.suffix);
        console.log("📌 Format Options Now Available:", formattedOptions);
        console.log("=== END DEBUG ===");

        const safeArrayData = (value) =>
          Array.isArray(value)
            ? value
            : typeof value === "string" && value
              ? value.split(",")
              : [];
        const safeString = (value) => (value != null ? String(value) : "");
        const toArray = (value) =>
          value != null && String(value).trim() !== ""
            ? String(value)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
            : [];

        // ✅ Find matching format by description
        const savedSuffix = safeString(instrumentData.instrument.suffix);
        const matchingFormat = formattedOptions.find(
          (opt) => opt.value === savedSuffix,
        );

        console.log("🔍 Looking for suffix:", savedSuffix);
        console.log("🔍 Found matching format:", matchingFormat);

        setFormData((prev) => ({
          ...prev,
          name: safeString(instrumentData.instrument.name),
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
            instrumentData.instrument.supportleastcount,
          ),
          supportunittype: safeString(
            instrumentData.instrument.supportunittype,
          ),
          supportmode: safeString(instrumentData.instrument.supportmode),
          scopematrixvalidation: safeString(
            instrumentData.instrument.scopematrixvalidation,
          ),
          digitincmc: safeString(instrumentData.instrument.digitincmc || "2"),
          biomedical: safeString(instrumentData.instrument.biomedical || "No"),
          showvisualtest: safeString(
            instrumentData.instrument.showvisualtest || "No",
          ),
          showelectricalsafety: safeString(
            instrumentData.instrument.showelectricalsafety || "No",
          ),
          showbasicsafety: safeString(
            instrumentData.instrument.showbasicsafety || "No",
          ),
          showperformancetest: safeString(
            instrumentData.instrument.showperformancetest || "No",
          ),
          setpoint: safeString(instrumentData.instrument.setpoint || "UUC"),
          uuc: safeString(instrumentData.instrument.uuc || "1"),
          master: safeString(instrumentData.instrument.master || "1"),
          setpointheading: safeString(
            instrumentData.instrument.setpointheading || "Set Point",
          ),
          parameterheading: safeString(
            instrumentData.instrument.parameterheading || "",
          ),
          uucheading: safeString(
            instrumentData.instrument.uucheading || "Observation On UUC",
          ),
          masterheading: safeString(
            instrumentData.instrument.masterheading || "Standard Reading",
          ),
          errorheading: safeString(
            instrumentData.instrument.errorheading || "Error",
          ),
          remarkheading: safeString(
            instrumentData.instrument.remarkheading || "Remark",
          ),
          setpointtoshow: safeString(
            instrumentData.instrument.setpointtoshow || "Yes",
          ),
          parametertoshow: safeString(
            instrumentData.instrument.parametertoshow || "Yes",
          ),
          uuctoshow: safeString(instrumentData.instrument.uuctoshow || "Yes"),
          mastertoshow: safeString(
            instrumentData.instrument.mastertoshow || "Yes",
          ),
          errortoshow: safeString(
            instrumentData.instrument.errortoshow || "Yes",
          ),
          remarktoshow: safeString(
            instrumentData.instrument.remarktoshow || "Yes",
          ),
          specificationtoshow: safeString(
            instrumentData.instrument.specificationtoshow || "Yes",
          ),
          specificationheading: safeString(
            instrumentData.instrument.specificationheading || "",
          ),
          tempsite: safeString(instrumentData.instrument.tempsite),
          tempvariablesite: safeString(
            instrumentData.instrument.tempvariablesite,
          ),
          humisite: safeString(instrumentData.instrument.humisite),
          humivariablesite: safeString(
            instrumentData.instrument.humivariablesite,
          ),
          templab: safeString(instrumentData.instrument.templab),
          tempvariablelab: safeString(
            instrumentData.instrument.tempvariablelab,
          ),
          humilab: safeString(instrumentData.instrument.humilab),
          humivariablelab: safeString(
            instrumentData.instrument.humivariablelab,
          ),
          mastersincertificate: safeString(
            instrumentData.instrument.mastersincertificate || "Yes",
          ),
          uncertaintyincertificate: safeString(
            instrumentData.instrument.uncertaintyincertificate || "Yes",
          ),
          allottolab: safeString(instrumentData.instrument.allottolab),
          // ✅ Store description for display AND id separately
          suffix: savedSuffix,
          suffixId: matchingFormat ? matchingFormat.id : "",
          uncertaintytable: safeArrayData(
            instrumentData.instrument.uncertaintytable,
          ),
          vertical: safeString(instrumentData.instrument.vertical || "1"),
        }));

        // ✅ Set saved IDs
        if (matchingFormat && matchingFormat.id) {
          const formatId = parseInt(matchingFormat.id, 10);
          if (!isNaN(formatId) && formatId > 0) {
            setSavedFormatId(formatId);
            console.log("✅ Loaded Format ID:", formatId);
          }
        }

        const uncertaintyData = safeArrayData(
          instrumentData.instrument.uncertaintytable,
        );
        if (uncertaintyData && uncertaintyData.length > 0) {
          // Find matching uncertainty by description
          const matchingUncertainties = formattedOptions.filter((opt) =>
            uncertaintyData.includes(opt.value),
          );

          if (matchingUncertainties.length > 0) {
            const uncertaintyIds = matchingUncertainties.map((u) =>
              parseInt(u.id, 10),
            );
            setFormData((prev) => ({
              ...prev,
              uncertaintyIds: uncertaintyIds,
            }));

            if (uncertaintyIds[0]) {
              setSavedUncertaintyId(uncertaintyIds[0]);
              console.log("✅ Loaded Uncertainty IDs:", uncertaintyIds);
            }
          }
        }

        // Set price lists
        const priceMatrix = Array.isArray(instrumentData.pricematrix)
          ? instrumentData.pricematrix
          : [];
        const fetchedPriceLists =
          priceMatrix.length > 0
            ? priceMatrix.map((price) => ({
              id: price.id || "",
              packagename: safeString(price.packagename),
              packagedesc: safeString(price.packagedesc),
              accreditation: safeString(price.accreditation),
              location: safeString(price.location),
              currency:
                mappedCurrencies.find(
                  (opt) => opt.value === safeString(price.currency),
                ) || null,
              rate: safeString(price.rate),
              daysrequired: safeString(price.daysrequired),
              matrices:
                Array.isArray(price.matrix) && price.matrix.length > 0
                  ? price.matrix.map((matrix, matrixIndex) => ({
                    id: matrix.id || "",
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

        setPriceLists(fetchedPriceLists);
      } catch (err) {
        toast.error("Error loading data");
        console.error("Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleMultiSelectChange = (selectedOptions, name) => {
    if (name === "suffix") {
      // Single select - store both description and id
      const selectedValue = selectedOptions ? selectedOptions.value : "";
      const selectedId = selectedOptions ? selectedOptions.id : "";

      setFormData((prev) => ({
        ...prev,
        [name]: selectedValue, // Description for display/API
        suffixId: selectedId, // ID stored separately
      }));
    } else if (name === "uncertaintytable") {
      // Multi select - store arrays of both descriptions and ids
      const selectedValues = selectedOptions
        ? selectedOptions.map((opt) => opt.value)
        : [];
      const selectedIds = selectedOptions
        ? selectedOptions.map((opt) => opt.id)
        : [];

      setFormData((prev) => ({
        ...prev,
        [name]: selectedValues, // Descriptions array
        uncertaintyIds: selectedIds, // IDs array stored separately
      }));
    } else {
      // Other fields remain unchanged
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
        id: "",
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
        (_, i) => i !== matrixIndex,
      );
      return updated;
    });
  };

  const addPriceList = () => {
    setPriceLists((prev) => [
      ...prev,
      {
        id: "",
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

  // Step 1: Update Instrument Details
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
        matrixidpricelist: [],
        pricematrixno: [],
        packagename: [],
        packagedesc: [],
        accreditationpricelist: [],
        locationpricelist: [],
        daysrequiredpricelist: [],
        ratepricelist: [],
        currencypricelist: [],
        pricematrix: [],
      };

      priceLists.forEach((price, priceIndex) => {
        payload.matrixidpricelist.push(price.id || "0");
        payload.pricematrixno.push(priceIndex.toString());
        payload.packagename.push(price.packagename || "");
        payload.packagedesc.push(price.packagedesc || "");
        payload.accreditationpricelist.push(price.accreditation || "");
        payload.locationpricelist.push(price.location || "");
        payload.daysrequiredpricelist.push(price.daysrequired || "");
        payload.ratepricelist.push(price.rate || "");
        payload.currencypricelist.push(price.currency?.value || "");
        payload.pricematrix.push(priceIndex.toString());

        payload[`matrixno${priceIndex}`] = [];
        payload[`pricematrixid${priceIndex}`] = [];
        payload[`matrixid${priceIndex}`] = [];
        payload[`unittype${priceIndex}`] = [];
        payload[`unit${priceIndex}`] = [];
        payload[`mode${priceIndex}`] = [];
        payload[`instrangemin${priceIndex}`] = [];
        payload[`instrangemax${priceIndex}`] = [];
        payload[`tolerance${priceIndex}`] = [];
        payload[`tolerancetype${priceIndex}`] = [];

        (price.matrices || []).forEach((matrix, matrixIndex) => {
          payload[`matrixno${priceIndex}`].push((matrixIndex + 1).toString());
          payload[`pricematrixid${priceIndex}`].push(price.id || "0");
          payload[`matrixid${priceIndex}`].push(matrix.id || "0");
          payload[`unittype${priceIndex}`].push(matrix.unittype || "");
          payload[`unit${priceIndex}`].push(matrix.unit || "");
          payload[`mode${priceIndex}`].push(matrix.mode || "");
          payload[`instrangemin${priceIndex}`].push(matrix.instrangemin || "");
          payload[`instrangemax${priceIndex}`].push(matrix.instrangemax || "");
          payload[`tolerance${priceIndex}`].push(matrix.tolerance || "");
          payload[`tolerancetype${priceIndex}`].push(
            matrix.tolerancetype || "",
          );
        });
      });

      console.log("FINAL UPDATE Payload:", payload);

      const response = await axios.post(
        `/calibrationoperations/update-instrument/${id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("=== UPDATE API RESPONSE ===");
      console.log("Response Data:", response.data);

      const instrumentId = id;
      const formatId = formData.suffixId || null;
      const uncertaintyId = formData.uncertaintyIds?.[0] || null;

      console.log("📌 Instrument ID from URL params:", instrumentId);

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
          console.log("✅ Valid Instrument ID:", finalInstrumentId);
          console.log("✅ Valid Format ID:", finalFormatId);

          setSavedInstrumentId(finalInstrumentId);
          setSavedFormatId(finalFormatId);

          if (uncertaintyId) {
            const finalUncertaintyId = parseInt(uncertaintyId, 10);
            if (!isNaN(finalUncertaintyId) && finalUncertaintyId > 0) {
              setSavedUncertaintyId(finalUncertaintyId);
              console.log("✅ Valid Uncertainty ID:", finalUncertaintyId);
            }
          }

          toast.success(
            `Step 1 Complete! Instrument ID: ${finalInstrumentId}, Format ID: ${finalFormatId}` +
            (uncertaintyId ? `, Uncertainty ID: ${uncertaintyId}` : ""),
          );

          setTimeout(() => {
            console.log("🚀 Moving to Step 2 with:", {
              instrumentId: finalInstrumentId,
              formatId: finalFormatId,
              uncertaintyId: uncertaintyId ? parseInt(uncertaintyId, 10) : null,
            });
            setCurrentStep(2);
          }, 100);
        } else {
          toast.error("Invalid data received. Please try again.");
          console.error("Invalid data:", {
            finalInstrumentId,
            finalFormatId,
            instrumentIdValid:
              !isNaN(finalInstrumentId) && finalInstrumentId > 0,
            formatIdValid: !isNaN(finalFormatId) && finalFormatId > 0,
          });
        }
      } else {
        if (!instrumentId) {
          toast.error("Instrument ID not received from server");
          console.error("Missing instid in response");
        }
        if (!formatId) {
          toast.error("Please select a Format before proceeding");
          console.error("No Format ID found in suffixId field");
        }
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error(err.response?.data?.message || "Error updating instrument");
    } finally {
      setLoading(false);
    }
  };

  // Step Progress Indicator - CLICKABLE VERSION with 4 steps
  const renderStepIndicator = () => {
    const handleStepClick = (step) => {
      // Allow going to step 1 always
      if (step === 1) {
        setCurrentStep(step);
        return;
      }

      // For step 2 - check if step 1 is completed
      if (step === 2) {
        if (savedInstrumentId && savedFormatId) {
          setCurrentStep(step);
        } else {
          toast.error("Please complete Step 1 first");
        }
        return;
      }

      // For step 3 - check if step 2 is completed
      if (step === 3) {
        if (savedInstrumentId && savedFormatId) {
          setCurrentStep(step);
        } else {
          toast.error("Please complete Step 2 first");
        }
        return;
      }

      // For step 4 - check if step 3 is completed
      if (step === 4) {
        if (savedInstrumentId && savedFormatId) {
          setCurrentStep(step);
        } else {
          toast.error("Please complete Step 3 first");
        }
        return;
      }
    };

    return (
      <div className="mb-6 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4].map((step) => {
            const isClickable =
              step === 1 ||
              (step === 2 && savedInstrumentId && savedFormatId) ||
              (step === 3 && savedInstrumentId && savedFormatId) ||
              (step === 4 && savedInstrumentId && savedFormatId);

            return (
              <div key={step} className="flex items-center">
                <button
                  type="button"
                  onClick={() => isClickable && handleStepClick(step)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${currentStep >= step
                    ? isClickable
                      ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                      : "cursor-default bg-blue-600 text-white"
                    : isClickable
                      ? "cursor-pointer bg-gray-300 text-gray-600 hover:bg-gray-400"
                      : "cursor-not-allowed bg-gray-300 text-gray-600"
                    } ${currentStep === step ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
                  disabled={!isClickable}
                  title={
                    step === 1
                      ? "Go to Step 1: Instrument Details"
                      : step === 2
                        ? isClickable
                          ? "Go to Step 2: Calibration Settings"
                          : "Complete Step 1 first"
                        : step === 3
                          ? isClickable
                            ? "Go to Step 3: Uncertainty"
                            : "Complete previous steps first"
                          : isClickable
                            ? "Go to Step 4: "
                            : "Complete previous steps first"
                  }
                >
                  {step}
                </button>
                {step < 4 && (
                  <div
                    className={`h-1 w-16 ${currentStep > step ? "bg-blue-600" : "bg-gray-300"
                      }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading && !formData.name) {
    return (
      <Page title="Edit Instrument">
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
              <span>Loading instrument data...</span>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Instrument">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {currentStep === 1 && "Step 1: Edit Instrument"}
            {currentStep === 2 && "Step 2: Calibration Results Settings"}
            {currentStep === 3 && "Step 3: Uncertainty"}
            {currentStep === 4 && "Step 4: "}
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

        {/* Step 1: Edit Instrument Form */}
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
              formData={formData || {}}
              errors={errors || {}}
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
                    Updating...
                  </div>
                ) : (
                  "Update & Continue"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Calibration Results Settings */}
        {currentStep === 2 && (
          <div>
            {savedInstrumentId && savedFormatId ? (
              <AddCalibration
                instrumentId={savedInstrumentId}
                instid={savedInstrumentId}
                formatId={savedFormatId}
                formatValue={formData.suffix}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-red-600">
                  Error: Format ID not found. Please go back and try again.
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
              <>
                {/* 
                <AddUncertainty
                  instrumentId={savedInstrumentId}
                  instid={savedInstrumentId}
                  formatId={savedFormatId}
                  uncertaintyId={savedUncertaintyId}
                  onComplete={() => setCurrentStep(4)}
                  onBack={() => setCurrentStep(2)}
                /> 
                */}
                <UncertainitySetting
                  instid={savedInstrumentId}
                  formatId={savedFormatId}
                  formatValue={formData.suffix}
                  onComplete={() => setCurrentStep(4)}
                  onBack={() => setCurrentStep(2)}
                />
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-red-600">
                  Error: Format ID not found. Please start from Step 1.
                </p>
                <Button onClick={() => setCurrentStep(1)} className="mt-4">
                  Go Back to Step 1
                </Button>
              </div>
            )}
          </div>
        )}
        {/* ✅ Step 4: Certificate Settings */}
        {currentStep === 4 && (
          <div>
            {savedInstrumentId && savedFormatId ? (
              <CertificateSetting
                instid={savedInstrumentId}
                formatId={savedFormatId}
                formatValue={formData.suffix}
                onComplete={() => {
                  toast.success("All steps completed successfully!");
                  navigate("/dashboards/calibration-operations/instrument-list");
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
