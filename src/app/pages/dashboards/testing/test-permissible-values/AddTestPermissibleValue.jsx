import { useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function AddTestPermissibleValue() {
  const navigate = useNavigate();

  // Main form state
  const [formData, setFormData] = useState({
    product: "",
    grade: "",
    size: "",
    standard: "",
    parameter: [],
    method: [],
    clause: [],
    pvaluemin: [],
    pvaluemax: [],
    specification: [],
    added_by: 31,
    updated_by: 31,
  });

  // Dropdown data states
  const [products, setProducts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [methods, setMethods] = useState([]);
  const [clauses, setClauses] = useState([]);

  // Dynamic parameter inputs
  const [parameterInputs, setParameterInputs] = useState([{ id: 1 }]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState({
    products: true,
    grades: true,
    sizes: true,
    standards: true,
    parameters: true,
    methods: true,
    clauses: true,
  });

  // Error states
  const [errors, setErrors] = useState({});

  // ✅ IMPROVED: Better response extraction matching PHP logic
  const extractArrayFromResponse = (responseData) => {
    console.log("🔍 Raw API Response:", responseData);

    // Handle different response structures
    if (responseData && typeof responseData === "object") {
      // Check for data property (most common)
      if (responseData.data) {
        if (Array.isArray(responseData.data)) {
          console.log(
            "✅ Found array in .data:",
            responseData.data.length,
            "items",
          );
          // Log first item structure for debugging
          if (responseData.data.length > 0) {
            console.log(
              "   First item structure:",
              Object.keys(responseData.data[0]),
            );
          }
          return responseData.data;
        }
        // Sometimes data is wrapped again
        if (responseData.data.data && Array.isArray(responseData.data.data)) {
          console.log(
            "✅ Found array in .data.data:",
            responseData.data.data.length,
            "items",
          );
          if (responseData.data.data.length > 0) {
            console.log(
              "   First item structure:",
              Object.keys(responseData.data.data[0]),
            );
          }
          return responseData.data.data;
        }
      }

      // Check for items property
      if (Array.isArray(responseData.items)) {
        console.log(
          "✅ Found array in .items:",
          responseData.items.length,
          "items",
        );
        if (responseData.items.length > 0) {
          console.log(
            "   First item structure:",
            Object.keys(responseData.items[0]),
          );
        }
        return responseData.items;
      }

      // Check for results property
      if (Array.isArray(responseData.results)) {
        console.log(
          "✅ Found array in .results:",
          responseData.results.length,
          "items",
        );
        if (responseData.results.length > 0) {
          console.log(
            "   First item structure:",
            Object.keys(responseData.results[0]),
          );
        }
        return responseData.results;
      }
    }

    // If already an array
    if (Array.isArray(responseData)) {
      console.log("✅ Already an array:", responseData.length, "items");
      if (responseData.length > 0) {
        console.log("   First item structure:", Object.keys(responseData[0]));
      }
      return responseData;
    }

    console.warn("⚠️ Could not extract array, returning empty array");
    return [];
  };

  // ✅ FIXED: Generate options matching PHP logic (status=1 filter)
  const generateOptions = (dataArray, fieldName = "unknown") => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      // Quietly return empty options if data isn't loaded yet
      return [];
    }

    const options = dataArray
      .filter((item) => {
        if (!item || typeof item !== "object") return false;

        // If no status field, include the item
        if (!Object.prototype.hasOwnProperty.call(item, "status")) {
          return true;
        }

        const status = item.status;
        const isActive =
          status === 1 ||
          status === "1" ||
          status === true ||
          status === "true" ||
          status === 99 ||
          status === "99";

        return isActive;
      })
      .map((item) => {
        const id = item.id || item.ID || item.Id || item.value;

        // priority-based name extraction
        let name =
          item.name ||
          item.Name ||
          item.method_name ||
          item.parameter_name ||
          item.grade_name ||
          item.standard_name ||
          item.standard_code ||
          item.clause_name ||
          item.size_name ||
          item.product_name ||
          item.code ||
          item.short_name ||
          item.sname ||
          item.label ||
          item.title ||
          item.text ||
          "";

        if (!name && item.description) {
          name = item.description;
        }

        // ✅ Smart fallback: scan all string fields (skip id/status/timestamps)
        if (!name) {
          const skipFields = new Set([
            "id",
            "ID",
            "Id",
            "status",
            "created_at",
            "updated_at",
            "deleted_at",
            "created_by",
            "updated_by",
            "deleted_by",
          ]);
          const firstStringField = Object.entries(item).find(
            ([key, val]) =>
              !skipFields.has(key) &&
              typeof val === "string" &&
              val.trim() !== "" &&
              isNaN(Number(val)),
          );
          if (firstStringField) {
            name = firstStringField[1];
          }
        }

        if (!name && id) {
          name = `Item ${id}`;
          console.warn(`⚠️ No name found for ${fieldName} item ${id}`);
        }

        // Append description if relevant
        if (
          item.description &&
          item.description.trim() !== "" &&
          item.description !== name &&
          !["grades", "standards", "methods", "clauses", "sizes"].includes(fieldName)
        ) {
          name = `${name} (${item.description})`;
        }

        const value = id !== undefined && id !== null ? String(id) : "";
        const label = name ? String(name).trim() : "";

        return { value, label };
      })
      .filter((option) => option.value && option.label);

    return options;
  };

  // ✅ IMPROVED: Fetch dropdown data with better error handling
  const fetchDropdownData = useCallback(async () => {
    console.log("🔄 Starting to fetch all dropdown data...");

    try {
      // Fetch all data in parallel
      const [
        productsRes,
        gradesRes,
        sizesRes,
        standardsRes,
        parametersRes,
        methodsRes,
        clausesRes,
      ] = await Promise.allSettled([
        axios.get("/testing/get-prodcut-list"),
        axios.get("/testing/get-grades"),
        axios.get("/testing/get-sizes"),
        axios.get("/testing/get-standards"),
        axios.get("/testing/get-perameter-list"),
        axios.get("/testing/get-methods"),
        axios.get("/testing/get-clauses"),
      ]);

      // Process each response
      const processResponse = (response, setter, name) => {
        setDropdownLoading((prev) => ({ ...prev, [name.toLowerCase()]: true }));

        if (response.status === "fulfilled") {
          console.log(`\n📦 ${name} Response:`, response.value);

          const extractedData = extractArrayFromResponse(response.value.data);
          console.log(`   Extracted ${extractedData.length} items`);

          if (extractedData.length > 0) {
            setter(extractedData);
            console.log(`✅ ${name} loaded successfully`);
          } else {
            console.warn(`⚠️ ${name}: No data found in response`);
            setter([]);
          }
        } else {
          console.error(`❌ ${name} failed:`, response.reason);
          setter([]);
          toast.error(`Failed to load ${name}`);
        }

        setDropdownLoading((prev) => ({
          ...prev,
          [name.toLowerCase()]: false,
        }));
      };

      processResponse(productsRes, setProducts, "Products");
      processResponse(gradesRes, setGrades, "Grades");
      processResponse(sizesRes, setSizes, "Sizes");
      processResponse(standardsRes, setStandards, "Standards");
      processResponse(parametersRes, setParameters, "Parameters");
      processResponse(methodsRes, setMethods, "Methods");
      processResponse(clausesRes, setClauses, "Clauses");

      console.log("\n✅ All dropdown data fetch completed");
    } catch (error) {
      console.error("❌ Critical error fetching dropdown data:", error);
      toast.error("Failed to load form data");

      // Reset all to empty arrays
      setProducts([]);
      setGrades([]);
      setSizes([]);
      setStandards([]);
      setParameters([]);
      setMethods([]);
      setClauses([]);

      // Set all loading to false
      setDropdownLoading({
        products: false,
        grades: false,
        sizes: false,
        standards: false,
        parameters: false,
        methods: false,
        clauses: false,
      });
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Debug log
  useEffect(() => {
    console.log("\n📊 Current Dropdown Status:", {
      products: `${products.length} items`,
      grades: `${grades.length} items`,
      sizes: `${sizes.length} items`,
      standards: `${standards.length} items`,
      parameters: `${parameters.length} items`,
      methods: `${methods.length} items`,
      clauses: `${clauses.length} items`,
    });
  }, [products, grades, sizes, standards, parameters, methods, clauses]);

  // Handle form field changes (for react-select dropdowns)
  const handleSelectChange = async (selectedOption, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption ? selectedOption.value : "",
    }));

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }

    // ✅ FIXED: Load Grade and Size based on selected product using the specific API
    if (fieldName === "product" && selectedOption) {
      try {
        console.log(`🪄 Product selected (ID: ${selectedOption.value}), fetching linked Grade & Size...`);

        setDropdownLoading(prev => ({ ...prev, grades: true, sizes: true }));
        const response = await axios.get(`/testing/get-grade-and-size?pid=${selectedOption.value}`);

        if (response.data.status) {
          console.log("📦 Received filtered grades and sizes:", response.data);
          setGrades(response.data.grades || []);
          setSizes(response.data.sizes || []);

          // Clear the previous selections to allow for a fresh filtered selection
          setFormData((prev) => ({
            ...prev,
            grade: "",
            size: "",
            standard: "",
          }));
        }
      } catch (error) {
        console.error("❌ Error fetching product grade/size:", error);
        toast.error("Failed to fetch linked Grade and Size");
      } finally {
        setDropdownLoading(prev => ({ ...prev, grades: false, sizes: false }));
      }
    } else if (fieldName === "product" && !selectedOption) {
      // Restore global lists if product is cleared
      fetchDropdownData();
      setFormData(prev => ({ ...prev, grade: "", size: "", standard: "" }));
    }
  };

  const handleArraySelectChange = (index, field, selectedOption) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = selectedOption ? selectedOption.value : "";
      return { ...prev, [field]: updatedArray };
    });
  };

  // Helper function to get selected option object for react-select
  const getSelectedOption = (value, options) => {
    if (!value) return null;
    return options.find((opt) => opt.value === String(value)) || null;
  };

  // Handle min/max value changes
  const handleParameterValueChange = (index, type, value) => {
    const field = type === "min" ? "pvaluemin" : "pvaluemax";
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Handle specification changes
  const handleSpecificationChange = (index, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev.specification];
      updatedArray[index] = value;
      return { ...prev, specification: updatedArray };
    });
  };

  // Add parameter row
  const addParameterRow = () => {
    const newId = parameterInputs.length + 1;
    setParameterInputs((prev) => [...prev, { id: newId }]);

    setFormData((prev) => ({
      ...prev,
      parameter: [...prev.parameter, ""],
      method: [...prev.method, ""],
      clause: [...prev.clause, ""],
      pvaluemin: [...prev.pvaluemin, ""],
      pvaluemax: [...prev.pvaluemax, ""],
      specification: [...prev.specification, ""],
    }));
  };

  // Remove parameter row
  const removeParameterRow = (index) => {
    if (parameterInputs.length === 1) {
      toast.error("At least one parameter is required");
      return;
    }

    setParameterInputs((prev) => prev.filter((_, i) => i !== index));

    setFormData((prev) => {
      const newFormData = { ...prev };
      [
        "parameter",
        "method",
        "clause",
        "pvaluemin",
        "pvaluemax",
        "specification",
      ].forEach((key) => {
        newFormData[key] = newFormData[key].filter((_, i) => i !== index);
      });
      return newFormData;
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    const requiredFields = ["product", "grade", "size", "standard"];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });

    formData.parameter.forEach((param, index) => {
      if (!param) {
        newErrors[`parameter_${index}`] = "Parameter is required";
      }
    });

    formData.method.forEach((method, index) => {
      if (!method) {
        newErrors[`method_${index}`] = "Method is required";
      }
    });

    formData.pvaluemin.forEach((min, index) => {
      const max = formData.pvaluemax[index];
      if (min && max && parseFloat(min) > parseFloat(max)) {
        newErrors[`value_${index}`] =
          "Min value cannot be greater than max value";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix form errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          formData[key].forEach((value) => {
            formDataToSend.append(`${key}[]`, value);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post(
        "/testing/add-permissible-value",
        formDataToSend,
      );
      const result = response.data;
      const newId = result?.data?.id || result?.id;

      toast.success("Test Permissible Value created successfully ✅", {
        duration: 2000,
      });

      setTimeout(() => {
        navigate("/dashboards/testing/test-permissible-values", {
          state: { updatedId: newId },
        });
      }, 1500);
    } catch (err) {
      console.error("Error creating permissible value:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create test permissible value";
      toast.error(errorMessage + " ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Test Permissible Value">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Add Test Permissible Value
          </h2>
          <Button
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() =>
              navigate("/dashboards/testing/test-permissible-values")
            }
          >
            ← Back to List
          </Button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800"
        >
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Product */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product <span className="text-red-500">*</span>
              </label>
              <Select
                name="product"
                options={generateOptions(products, "products")}
                value={getSelectedOption(
                  formData.product,
                  generateOptions(products, "products"),
                )}
                onChange={(option) => handleSelectChange(option, "product")}
                isDisabled={dropdownLoading.products}
                isLoading={dropdownLoading.products}
                placeholder="Select Product"
                className="react-select"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "rgb(255 255 255 / 1)",
                    borderColor: "rgb(209 213 219 / 1)",
                    color: "rgb(17 24 39 / 1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "rgb(59 130 246 / 1)"
                      : state.isFocused
                        ? "rgb(219 234 254 / 1)"
                        : "rgb(255 255 255 / 1)",
                    color: state.isSelected ? "white" : "rgb(17 24 39 / 1)",
                  }),
                }}
              />
              {errors.product && (
                <p className="mt-1 text-sm text-red-500">{errors.product}</p>
              )}

            </div>

            {/* Grade */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Grade <span className="text-red-500">*</span>
              </label>
              <Select
                name="grade"
                options={generateOptions(grades, "grades")}
                value={getSelectedOption(
                  formData.grade,
                  generateOptions(grades, "grades"),
                )}
                onChange={(option) => handleSelectChange(option, "grade")}
                isDisabled={dropdownLoading.grades}
                isLoading={dropdownLoading.grades}
                placeholder="Select Grade"
                className="react-select"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "rgb(255 255 255 / 1)",
                    borderColor: "rgb(209 213 219 / 1)",
                    color: "rgb(17 24 39 / 1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "rgb(59 130 246 / 1)"
                      : state.isFocused
                        ? "rgb(219 234 254 / 1)"
                        : "rgb(255 255 255 / 1)",
                    color: state.isSelected ? "white" : "rgb(17 24 39 / 1)",
                  }),
                }}
              />
              {errors.grade && (
                <p className="mt-1 text-sm text-red-500">{errors.grade}</p>
              )}

            </div>

            {/* Size */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Size <span className="text-red-500">*</span>
              </label>
              <Select
                name="size"
                options={generateOptions(sizes, "sizes")}
                value={getSelectedOption(
                  formData.size,
                  generateOptions(sizes, "sizes"),
                )}
                onChange={(option) => handleSelectChange(option, "size")}
                isDisabled={dropdownLoading.sizes}
                isLoading={dropdownLoading.sizes}
                placeholder="Select Size"
                className="react-select"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "rgb(255 255 255 / 1)",
                    borderColor: "rgb(209 213 219 / 1)",
                    color: "rgb(17 24 39 / 1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "rgb(59 130 246 / 1)"
                      : state.isFocused
                        ? "rgb(219 234 254 / 1)"
                        : "rgb(255 255 255 / 1)",
                    color: state.isSelected ? "white" : "rgb(17 24 39 / 1)",
                  }),
                }}
              />
              {errors.size && (
                <p className="mt-1 text-sm text-red-500">{errors.size}</p>
              )}

            </div>

            {/* Standard */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Standard <span className="text-red-500">*</span>
              </label>
              <Select
                name="standard"
                options={generateOptions(standards, "standards")}
                value={getSelectedOption(
                  formData.standard,
                  generateOptions(standards, "standards"),
                )}
                onChange={(option) => handleSelectChange(option, "standard")}
                isDisabled={dropdownLoading.standards}
                isLoading={dropdownLoading.standards}
                placeholder="Select Standard"
                className="react-select"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "rgb(255 255 255 / 1)",
                    borderColor: "rgb(209 213 219 / 1)",
                    color: "rgb(17 24 39 / 1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "rgb(59 130 246 / 1)"
                      : state.isFocused
                        ? "rgb(219 234 254 / 1)"
                        : "rgb(255 255 255 / 1)",
                    color: state.isSelected ? "white" : "rgb(17 24 39 / 1)",
                  }),
                }}
              />
              {errors.standard && (
                <p className="mt-1 text-sm text-red-500">{errors.standard}</p>
              )}

            </div>
          </div>

          {/* Parameters Section */}
          <div className="border-t pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Parameters
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParameterRow}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                + Add Parameter
              </Button>
            </div>

            {parameterInputs.map((row, index) => (
              <div
                key={row.id}
                className="mb-4 rounded-lg border bg-gray-50 p-4 dark:bg-gray-700"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Parameter #{index + 1}
                  </span>
                  {parameterInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameterRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Parameter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Parameter <span className="text-red-500">*</span>
                    </label>
                    <Select
                      name={`parameter_${index}`}
                      options={generateOptions(parameters, "parameters")}
                      value={getSelectedOption(
                        formData.parameter[index],
                        generateOptions(parameters, "parameters"),
                      )}
                      onChange={(option) =>
                        handleArraySelectChange(index, "parameter", option)
                      }
                      isDisabled={dropdownLoading.parameters}
                      isLoading={dropdownLoading.parameters}
                      placeholder="Select Parameter"
                      className="react-select"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "rgb(255 255 255 / 1)",
                          borderColor: "rgb(209 213 219 / 1)",
                          color: "rgb(17 24 39 / 1)",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "rgb(59 130 246 / 1)"
                            : state.isFocused
                              ? "rgb(219 234 254 / 1)"
                              : "rgb(255 255 255 / 1)",
                          color: state.isSelected
                            ? "white"
                            : "rgb(17 24 39 / 1)",
                        }),
                      }}
                    />
                    {errors[`parameter_${index}`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[`parameter_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Method */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Method <span className="text-red-500">*</span>
                    </label>
                    <Select
                      name={`method_${index}`}
                      options={generateOptions(methods, "methods")}
                      value={getSelectedOption(
                        formData.method[index],
                        generateOptions(methods, "methods"),
                      )}
                      onChange={(option) =>
                        handleArraySelectChange(index, "method", option)
                      }
                      isDisabled={dropdownLoading.methods}
                      isLoading={dropdownLoading.methods}
                      placeholder="Select Method"
                      className="react-select"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "rgb(255 255 255 / 1)",
                          borderColor: "rgb(209 213 219 / 1)",
                          color: "rgb(17 24 39 / 1)",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "rgb(59 130 246 / 1)"
                            : state.isFocused
                              ? "rgb(219 234 254 / 1)"
                              : "rgb(255 255 255 / 1)",
                          color: state.isSelected
                            ? "white"
                            : "rgb(17 24 39 / 1)",
                        }),
                      }}
                    />
                    {errors[`method_${index}`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[`method_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Clause */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clause
                    </label>
                    <Select
                      name={`clause_${index}`}
                      options={generateOptions(clauses, "clauses")}
                      value={getSelectedOption(
                        formData.clause[index],
                        generateOptions(clauses, "clauses"),
                      )}
                      onChange={(option) =>
                        handleArraySelectChange(index, "clause", option)
                      }
                      isDisabled={dropdownLoading.clauses}
                      isLoading={dropdownLoading.clauses}
                      placeholder="Select Clause"
                      className="react-select"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "rgb(255 255 255 / 1)",
                          borderColor: "rgb(209 213 219 / 1)",
                          color: "rgb(17 24 39 / 1)",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "rgb(59 130 246 / 1)"
                            : state.isFocused
                              ? "rgb(219 234 254 / 1)"
                              : "rgb(255 255 255 / 1)",
                          color: state.isSelected
                            ? "white"
                            : "rgb(17 24 39 / 1)",
                        }),
                      }}
                    />
                  </div>

                  {/* Min Value */}
                  <div>
                    <Input
                      label="Min Value"
                      type="text"
                      value={formData.pvaluemin[index] || ""}
                      onChange={(e) =>
                        handleParameterValueChange(index, "min", e.target.value)
                      }
                      placeholder="Enter minimum value"
                    />
                  </div>

                  {/* Max Value */}
                  <div>
                    <Input
                      label="Max Value"
                      type="text"
                      value={formData.pvaluemax[index] || ""}
                      onChange={(e) =>
                        handleParameterValueChange(index, "max", e.target.value)
                      }
                      placeholder="Enter maximum value"
                    />
                  </div>

                  {/* Specification */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Input
                      label="Specification"
                      value={formData.specification[index] || ""}
                      onChange={(e) =>
                        handleSpecificationChange(index, e.target.value)
                      }
                      placeholder="Enter specification details"
                    />
                  </div>
                </div>

                {errors[`value_${index}`] && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors[`value_${index}`]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate("/dashboards/testing/test-permissible-values")
              }
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
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
                  Saving...
                </div>
              ) : (
                "Save Permissible Value"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
