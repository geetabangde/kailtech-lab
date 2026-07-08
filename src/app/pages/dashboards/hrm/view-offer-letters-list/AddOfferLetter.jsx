import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button, Card, Input, Select } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// ----------------------------------------------------------------------

export default function AddOfferLetter() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  // Dynamic Options States
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [structureRules, setStructureRules] = useState(null);
  const [genders, setGenders] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    prefix: "",
    firstname: "",
    middlename: "",
    lastname: "",
    mobile: "",
    email: "",
    gender: "",
    dob: "",
    joiningdate: "",
    duration: "",
    branch: "",
    department: "",
    designation: "",
    offerletterdate: "",
    salarystructure: "",
    gross: "",
    basic: "",
    hra: "",
    sa: "",
    bonus: "",
    epfemp: "0.00",
    esicemp: "0.00",
    pt: "0.00",
    netinhand: "0.00",
    epfemployer: "0.00",
    esicemployer: "0.00",
    mobileallowance: "",
    grossctcmonth: "0.00",
    grossctcannual: "0.00",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Fetch all options on mount in parallel
  const fetchAllOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      const [branchRes, deptRes, desigRes, structRes, taxRes, genderRes] = await Promise.all([
        axios.get("/hrm/list-branch").catch(() => ({ data: { data: [] } })),
        axios.get("/hrm/department-list").catch(() => ({ data: { data: [] } })),
        axios.get("/hrm/designation-list").catch(() => ({ data: { data: [] } })),
        axios.get("/hrm/salary-structure-list").catch(() => ({ data: { data: [] } })),
        axios.get("/hrm/professional-tax-list").catch(() => ({ data: { data: [] } })),
        axios.get("/hrm/gender-list").catch(() => 
          axios.get("/hrm/list-gender").catch(() => ({ data: { data: [] } }))
        ),
      ]);

      const branchesList = branchRes.data?.data || branchRes.data || [];
      const departmentsList = deptRes.data?.data || deptRes.data || [];
      const designationsList = desigRes.data?.data || desigRes.data || [];
      const structuresList = structRes.data?.data || structRes.data || [];
      const taxesList = taxRes.data?.data || taxRes.data || [];
      const gendersList = genderRes.data?.data || genderRes.data || [];

      setBranches(branchesList);
      setDepartments(departmentsList);
      setDesignations(designationsList);
      setSalaryStructures(structuresList);
      setTaxSlabs(taxesList);

      if (gendersList && gendersList.length > 0) {
        setGenders(
          gendersList.map((g) => ({
            value: String(g.id || g.value),
            label: g.name || g.label,
          }))
        );
      } else {
        setGenders([
          { value: "1", label: "Male" },
          { value: "2", label: "Female" },
          { value: "3", label: "Other" },
        ]);
      }

      // Pre-select active salary structure if status === 1 or active is found
      const activeStruct = structuresList.find((s) => s.status === 1 || String(s.status) === "1");
      if (activeStruct) {
        setFormData((prev) => ({
          ...prev,
          salarystructure: activeStruct.id || activeStruct.value || "",
        }));
        fetchStructureRules(activeStruct.id || activeStruct.value);
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      toast.error("Failed to load form options ❌");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (permissions.includes(249)) {
      fetchAllOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAllOptions]);

  // Fetch rules for selected salary structure
  const fetchStructureRules = async (structureId) => {
    if (!structureId) {
      setStructureRules(null);
      return;
    }
    try {
      const res = await axios.get(`/hrm/salary-structure-get-byid/${structureId}`);
      if (res.data?.status && res.data?.data) {
        setStructureRules(res.data.data);
      } else if (res.data) {
        setStructureRules(res.data);
      }
    } catch (err) {
      console.error("Error fetching structure rules:", err);
      toast.error("Failed to load rules for selected salary structure ❌");
    }
  };

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Custom Select dropdown handler
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (name === "salarystructure") {
      fetchStructureRules(value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  // Field validation
  const validateField = (fieldName, value) => {
    let error = "";
    if (value === undefined || value === null || String(value).trim() === "") {
      if (
        ![
          "middlename",
          "prefix",
          "email",
          "dob",
          "offerletterdate",
          "sa",
          "bonus",
          "mobileallowance",
        ].includes(fieldName)
      ) {
        error = "This field is required";
      }
    }

    if (fieldName === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      error = "Please enter a valid email address";
    }

    if (fieldName === "mobile" && value && !/^\+?[0-9\s-]{10,15}$/.test(value)) {
      error = "Please enter a valid mobile number";
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === "";
  };

  // Validate the whole form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    const requiredFields = [
      "firstname",
      "lastname",
      "mobile",
      "gender",
      "joiningdate",
      "duration",
      "branch",
      "department",
      "designation",
      "salarystructure",
      "gross",
    ];

    requiredFields.forEach((key) => {
      const value = formData[key];
      if (value === undefined || value === null || String(value).trim() === "") {
        newErrors[key] = "This field is required";
        isValid = false;
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (formData.mobile && !/^\+?[0-9\s-]{10,15}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid mobile number";
      isValid = false;
    }

    // 18-year age validation gap between DOB and Joining Date
    if (formData.dob && formData.joiningdate) {
      const dobDate = new Date(formData.dob);
      const joinDate = new Date(formData.joiningdate);
      let age = joinDate.getFullYear() - dobDate.getFullYear();
      const m = joinDate.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && joinDate.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.joiningdate = "Employee should be minimum 18 years old";
        toast.error("Employee should be minimum 18 years old ❌");
        isValid = false;
      }
    }

    setErrors(newErrors);
    
    // Touch all fields
    const allTouched = {};
    Object.keys(formData).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched(allTouched);

    return isValid;
  };

  // Salary Calculations Trigger Effect
  useEffect(() => {
    const gross = parseFloat(formData.gross) || 0;
    let basic = parseFloat(formData.basic) || 0;
    let hra = parseFloat(formData.hra) || 0;
    let sa = parseFloat(formData.sa) || 0;
    let bonus = parseFloat(formData.bonus) || 0;
    let epfemp = parseFloat(formData.epfemp) || 0;
    let esicemp = parseFloat(formData.esicemp) || 0;
    let pt = parseFloat(formData.pt) || 0;
    let epfemployer = parseFloat(formData.epfemployer) || 0;
    let esicemployer = parseFloat(formData.esicemployer) || 0;
    let mobileallowance = parseFloat(formData.mobileallowance) || 0;

    if (structureRules) {
      const basicPercent = parseFloat(structureRules.basic || structureRules.basicpercent) || 0;
      const hraPercent = parseFloat(structureRules.hra || structureRules.hrapercent) || 0;
      const saPercent = parseFloat(structureRules.sa || structureRules.sapercent) || 0;
      const bonusPercent = parseFloat(structureRules.bonus || structureRules.bonuspercent) || 0;
      const epfempPercent = parseFloat(structureRules.epfemp) || 0;
      const esicempPercent = parseFloat(structureRules.esicemp) || 0;
      const epfemployerPercent = parseFloat(structureRules.epfemployer) || 0;
      const esicemployerPercent = parseFloat(structureRules.esicemployer) || 0;
      const mobileallowancePercent = parseFloat(structureRules.mobileallowance) || 0;

      const sumOfDependents = (percentOfStr) => {
        if (!percentOfStr || percentOfStr === "manual" || percentOfStr === "Not Required") return 0;
        const parts = percentOfStr.split(",");
        let sum = 0;
        parts.forEach((part) => {
          const trimmed = part.trim();
          if (trimmed === "Gross") sum += gross;
          else if (trimmed === "Basic") sum += basic;
          else if (trimmed === "Special Allowances" || trimmed === "SA") sum += sa;
          else if (trimmed === "HRA") sum += hra;
          else if (trimmed === "Bonus") sum += bonus;
        });
        return sum;
      };

      // 1. Basic calculation
      if (structureRules.basicpercentof !== "manual") {
        if (structureRules.basicpercentof === "Not Required") {
          basic = 0;
        } else {
          const basis = sumOfDependents(structureRules.basicpercentof);
          basic = (basis * basicPercent) / 100;
        }
      }

      // 2. HRA calculation
      if (structureRules.hrapercentof !== "manual") {
        if (structureRules.hrapercentof === "Not Required") {
          hra = 0;
        } else {
          const basis = sumOfDependents(structureRules.hrapercentof);
          hra = (basis * hraPercent) / 100;
        }
      }

      // 3. Special Allowance calculation (if not manual)
      if (structureRules.sapercentof !== "manual") {
        if (structureRules.sapercentof === "Not Required") {
          sa = 0;
        } else {
          const basis = sumOfDependents(structureRules.sapercentof);
          sa = (basis * saPercent) / 100;
        }
      }

      // 4. Bonus calculation (if not manual)
      if (structureRules.bonuspercentof !== "Not Required") {
        if (structureRules.bonuspercentof !== "manual") {
          const basis = sumOfDependents(structureRules.bonuspercentof);
          bonus = (basis * bonusPercent) / 100;
        }
      } else {
        bonus = 0;
      }

      // 5. EPF Employee calculation
      if (structureRules.pfrequired === "Yes" && structureRules.epfemppercentof !== "Not Required") {
        if (structureRules.epfemppercentof !== "manual") {
          let pfBasis = sumOfDependents(structureRules.epfemppercentof);
          const pfMaxVal = parseFloat(structureRules.pfmax) || 15000;
          if (pfBasis > pfMaxVal) pfBasis = pfMaxVal;
          epfemp = (pfBasis * epfempPercent) / 100;
        }
      } else {
        epfemp = 0;
      }

      // 6. ESIC Employee calculation
      if (structureRules.esicrequired === "Yes" && structureRules.esicemppercentof !== "Not Required") {
        if (structureRules.esicemppercentof !== "manual") {
          const esicMinVal = parseFloat(structureRules.esicmin) || 0;
          const esicMaxVal = parseFloat(structureRules.esicmax) || 21000;
          if (gross >= esicMinVal && gross <= esicMaxVal) {
            esicemp = (gross * esicempPercent) / 100;
          } else {
            esicemp = 0;
          }
        }
      } else {
        esicemp = 0;
      }

      // 7. EPF Employer calculation
      if (structureRules.pfrequired === "Yes" && structureRules.epfemployerpercentof !== "Not Required") {
        if (structureRules.epfemployerpercentof !== "manual") {
          let pfBasis = sumOfDependents(structureRules.epfemployerpercentof);
          const pfMaxVal = parseFloat(structureRules.pfmax) || 15000;
          if (pfBasis > pfMaxVal) pfBasis = pfMaxVal;
          epfemployer = (pfBasis * epfemployerPercent) / 100;
        }
      } else {
        epfemployer = 0;
      }

      // 8. ESIC Employer calculation
      if (structureRules.esicrequired === "Yes" && structureRules.esicemployerpercetof !== "Not Required") {
        if (structureRules.esicemployerpercetof !== "manual") {
          const esicMinVal = parseFloat(structureRules.esicmin) || 0;
          const esicMaxVal = parseFloat(structureRules.esicmax) || 21000;
          if (gross >= esicMinVal && gross <= esicMaxVal) {
            esicemployer = (gross * esicemployerPercent) / 100;
          } else {
            esicemployer = 0;
          }
        }
      } else {
        esicemployer = 0;
      }

      // 9. Mobile Allowance calculation
      if (structureRules.mobileallowancepercentof !== "Not Required") {
        if (structureRules.mobileallowancepercentof !== "manual") {
          const basis = sumOfDependents(structureRules.mobileallowancepercentof);
          mobileallowance = (basis * mobileallowancePercent) / 100;
        }
      } else {
        mobileallowance = 0;
      }
    }

    // 10. Professional Tax calculation (matching dynamic taxSlabs)
    let matchingPT = 0;
    if (taxSlabs && taxSlabs.length > 0) {
      const matchedSlab = taxSlabs.find((slab) => {
        const lower = parseFloat(slab.lowerlimit) || 0;
        const upper = parseFloat(slab.upperlimit) || 999999999;
        return gross >= lower && gross <= upper;
      });
      if (matchedSlab) {
        matchingPT = parseFloat(matchedSlab.amount) || 0;
      }
    } else {
      if (gross > 10000) matchingPT = 200;
      else if (gross > 7500) matchingPT = 175;
      else matchingPT = 0;
    }
    pt = matchingPT;

    // 11. Totals calculation
    const netinhand = gross - epfemp - esicemp - pt;
    const grossctcmonth = gross + epfemployer + esicemployer + mobileallowance;
    const grossctcannual = grossctcmonth * 12;

    // Prevent recursive infinite state updates
    if (
      parseFloat(formData.basic || 0).toFixed(2) !== basic.toFixed(2) ||
      parseFloat(formData.hra || 0).toFixed(2) !== hra.toFixed(2) ||
      parseFloat(formData.sa || 0).toFixed(2) !== sa.toFixed(2) ||
      parseFloat(formData.bonus || 0).toFixed(2) !== bonus.toFixed(2) ||
      parseFloat(formData.epfemp || 0).toFixed(2) !== epfemp.toFixed(2) ||
      parseFloat(formData.esicemp || 0).toFixed(2) !== esicemp.toFixed(2) ||
      parseFloat(formData.pt || 0).toFixed(2) !== pt.toFixed(2) ||
      parseFloat(formData.epfemployer || 0).toFixed(2) !== epfemployer.toFixed(2) ||
      parseFloat(formData.esicemployer || 0).toFixed(2) !== esicemployer.toFixed(2) ||
      parseFloat(formData.mobileallowance || 0).toFixed(2) !== mobileallowance.toFixed(2) ||
      parseFloat(formData.netinhand || 0).toFixed(2) !== netinhand.toFixed(2) ||
      parseFloat(formData.grossctcmonth || 0).toFixed(2) !== grossctcmonth.toFixed(2) ||
      parseFloat(formData.grossctcannual || 0).toFixed(2) !== grossctcannual.toFixed(2)
    ) {
      setFormData((prev) => ({
        ...prev,
        basic: basic.toFixed(2),
        hra: hra.toFixed(2),
        sa: sa.toFixed(2),
        bonus: bonus.toFixed(2),
        epfemp: epfemp.toFixed(2),
        esicemp: esicemp.toFixed(2),
        pt: pt.toFixed(2),
        epfemployer: epfemployer.toFixed(2),
        esicemployer: esicemployer.toFixed(2),
        mobileallowance: mobileallowance.toFixed(2),
        netinhand: netinhand.toFixed(2),
        grossctcmonth: grossctcmonth.toFixed(2),
        grossctcannual: grossctcannual.toFixed(2),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.gross,
    formData.basic,
    formData.hra,
    formData.sa,
    formData.bonus,
    formData.mobileallowance,
    structureRules,
    taxSlabs,
  ]);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly ❌");
      return;
    }

    setSubmitting(true);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value || "");
      });

      try {
        await axios.post("/hrm/insert-offer-letter", form);
      } catch (err) {
        if (err?.response?.status === 404) {
          await axios.post("/hrm/add-offer-letter", form);
        } else {
          throw err;
        }
      }

      toast.success("Offer Letter created successfully ✅", {
        duration: 2000,
        icon: "✅",
      });

      navigate("/dashboards/hrm/view-offer-letters-list");
    } catch (err) {
      console.error("Error creating Offer Letter:", err);
      toast.error(err?.response?.data?.message || "Failed to create Offer Letter ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // Permission Gate: PHP code requires permission 249 to Add Offer Letters
  if (!permissions.includes(249)) {
    return (
      <Page title="Add Offer Letter">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 249 required to add offer letters
          </p>
        </div>
      </Page>
    );
  }

  const prefixOptions = [
    { value: "Mr.", label: "Mr." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Miss", label: "Miss" },
  ];

  const genderOptions = genders;

  if (loadingOptions) {
    return (
      <Page title="Add Offer Letter::.Joining Process-Hrm">
        <div className="flex h-[60vh] items-center justify-center text-gray-600 dark:text-dark-200">
          <svg className="mr-2 h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading options...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add Offer Letter::.Joining Process-Hrm">
      <div className="transition-content p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permissions.includes(246) && (
              <button
                onClick={() => navigate("/dashboards/hrm/view-offer-letters-list")}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-800 transition"
                title="Back to List"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-dark-200" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
                Add Offer Letter
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Issue a new employment offer letter and configure payroll structure
              </p>
            </div>
          </div>
          {permissions.includes(246) && (
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700 font-medium h-9 rounded-md px-4"
              onClick={() => navigate("/dashboards/hrm/view-offer-letters-list")}
            >
              &lt;&lt; Back
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Candidate Metadata */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
            <h3 className="text-base font-bold text-gray-800 dark:text-dark-100 mb-6 pb-2 border-b border-gray-100 dark:border-dark-600">
              Candidate Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Prefix */}
              <div>
                <Select
                  label="Prefix"
                  name="prefix"
                  options={prefixOptions}
                  value={formData.prefix}
                  onChange={(value) => handleSelectChange("prefix", value)}
                  placeholder="Select..."
                />
              </div>

              {/* First Name */}
              <div>
                <Input
                  label="First Name *"
                  name="firstname"
                  placeholder="First name"
                  value={formData.firstname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.firstname && errors.firstname}
                />
              </div>

              {/* Middle Name */}
              <div>
                <Input
                  label="Middle Name"
                  name="middlename"
                  placeholder="Middle name"
                  value={formData.middlename}
                  onChange={handleChange}
                />
              </div>

              {/* Last Name */}
              <div>
                <Input
                  label="Last Name *"
                  name="lastname"
                  placeholder="Last name"
                  value={formData.lastname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.lastname && errors.lastname}
                />
              </div>

              {/* Mobile */}
              <div className="md:col-span-2">
                <Input
                  label="Mobile *"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.mobile && errors.mobile}
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <Input
                  label="Email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && errors.email}
                />
              </div>

              {/* Gender */}
              <div>
                <Select
                  label="Gender *"
                  name="gender"
                  options={genderOptions}
                  value={formData.gender}
                  onChange={(value) => handleSelectChange("gender", value)}
                  error={touched.gender && errors.gender}
                  placeholder="Select..."
                />
              </div>

              {/* DOB */}
              <div>
                <Input
                  label="DOB"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              {/* Joining Date */}
              <div>
                <Input
                  label="Joining Date *"
                  name="joiningdate"
                  type="date"
                  value={formData.joiningdate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.joiningdate && errors.joiningdate}
                />
              </div>

              {/* Probation Duration */}
              <div>
                <Input
                  label="Probation (Months) *"
                  name="duration"
                  type="number"
                  placeholder="Probation months"
                  value={formData.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.duration && errors.duration}
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Department and Location */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
            <h3 className="text-base font-bold text-gray-800 dark:text-dark-100 mb-6 pb-2 border-b border-gray-100 dark:border-dark-600">
              Employment Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Branch */}
              <div className="md:col-span-2">
                <Select
                  label="Branch *"
                  name="branch"
                  options={branches.map((b) => ({
                    value: b.id || b.value,
                    label: b.name && b.location ? `${b.name} / ${b.location}` : (b.name || b.label),
                  }))}
                  value={formData.branch}
                  onChange={(value) => handleSelectChange("branch", value)}
                  error={touched.branch && errors.branch}
                  placeholder="Select branch..."
                />
              </div>

              {/* Labs / Department */}
              <div className="md:col-span-2">
                <Select
                  label="Labs *"
                  name="department"
                  options={departments.map((d) => ({
                    value: d.id || d.value,
                    label: d.name || d.label,
                  }))}
                  value={formData.department}
                  onChange={(value) => handleSelectChange("department", value)}
                  error={touched.department && errors.department}
                  placeholder="Select lab..."
                />
              </div>

              {/* Designation */}
              <div className="md:col-span-2">
                <Select
                  label="Designation *"
                  name="designation"
                  options={designations.map((d) => ({
                    value: d.id || d.value,
                    label: d.name || d.label,
                  }))}
                  value={formData.designation}
                  onChange={(value) => handleSelectChange("designation", value)}
                  error={touched.designation && errors.designation}
                  placeholder="Select designation..."
                />
              </div>

              {/* Offer Letter Date */}
              <div className="md:col-span-2">
                <Input
                  label="Offer Letter Date"
                  name="offerletterdate"
                  type="date"
                  value={formData.offerletterdate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Salary and Structure */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
            <h3 className="text-base font-bold text-gray-800 dark:text-dark-100 mb-6 pb-2 border-b border-gray-100 dark:border-dark-600">
              Salary Details & Payroll Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Salary Structure Select */}
              <div className="md:col-span-2">
                <Select
                  label="Salary Structure *"
                  name="salarystructure"
                  options={salaryStructures.map((s) => ({
                    value: s.id || s.value,
                    label: s.name || s.label,
                  }))}
                  value={formData.salarystructure}
                  onChange={(value) => handleSelectChange("salarystructure", value)}
                  error={touched.salarystructure && errors.salarystructure}
                  placeholder="Select structure..."
                />
              </div>

              {/* Gross Salary */}
              <div>
                <Input
                  label="Gross Salary (Monthly) *"
                  name="gross"
                  type="number"
                  placeholder="Enter gross amount"
                  value={formData.gross}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.gross && errors.gross}
                />
              </div>

              {/* Basic Salary */}
              <div>
                <Input
                  label="Basic Salary"
                  name="basic"
                  type="number"
                  placeholder="Basic component"
                  value={formData.basic}
                  onChange={handleChange}
                  readOnly={structureRules?.basicpercentof !== "manual"}
                  description={
                    structureRules?.basicpercentof && structureRules.basicpercentof !== "manual"
                      ? `Calculated (${structureRules.basic}% of ${structureRules.basicpercentof})`
                      : "Manually editable"
                  }
                />
              </div>

              {/* HRA */}
              <div>
                <Input
                  label="HRA"
                  name="hra"
                  type="number"
                  placeholder="HRA component"
                  value={formData.hra}
                  onChange={handleChange}
                  readOnly={structureRules?.hrapercentof !== "manual"}
                  description={
                    structureRules?.hrapercentof && structureRules.hrapercentof !== "manual"
                      ? `Calculated (${structureRules.hra}% of ${structureRules.hrapercentof})`
                      : "Manually editable"
                  }
                />
              </div>

              {/* Special Allowance */}
              <div>
                <Input
                  label="Special Allowance"
                  name="sa"
                  type="number"
                  placeholder="Special allowance component"
                  value={formData.sa}
                  onChange={handleChange}
                  readOnly={structureRules?.sapercentof !== "manual"}
                  description={
                    structureRules?.sapercentof && structureRules.sapercentof !== "manual"
                      ? `Calculated (${structureRules.sa}% of ${structureRules.sapercentof})`
                      : "Manually editable"
                  }
                />
              </div>

              {/* Bonus */}
              {structureRules?.bonuspercentof !== "Not Required" && (
                <div>
                  <Input
                    label="Bonus"
                    name="bonus"
                    type="number"
                    placeholder="Bonus component"
                    value={formData.bonus}
                    onChange={handleChange}
                    readOnly={structureRules?.bonuspercentof !== "manual"}
                    description={
                      structureRules?.bonuspercentof && structureRules.bonuspercentof !== "manual"
                        ? `Calculated (${structureRules.bonus}% of ${structureRules.bonuspercentof})`
                        : "Manually editable"
                    }
                  />
                </div>
              )}

              {/* Mobile Allowance */}
              {structureRules?.mobileallowancepercentof !== "Not Required" && (
                <div>
                  <Input
                    label="Mobile Allowance"
                    name="mobileallowance"
                    type="number"
                    placeholder="Mobile allowance component"
                    value={formData.mobileallowance}
                    onChange={handleChange}
                    readOnly={structureRules?.mobileallowancepercentof !== "manual"}
                    description={
                      structureRules?.mobileallowancepercentof && structureRules.mobileallowancepercentof !== "manual"
                        ? `Calculated (${structureRules.mobileallowance}% of ${structureRules.mobileallowancepercentof})`
                        : "Manually editable"
                    }
                  />
                </div>
              )}
            </div>

            {/* Deductions Header */}
            <h4 className="text-sm font-bold text-gray-700 dark:text-dark-200 mt-8 mb-4 border-b border-gray-100 dark:border-dark-600 pb-1">
              Deductions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EPF Employee */}
              <div>
                <Input
                  label="EPF Contribution (Employee)"
                  name="epfemp"
                  type="number"
                  value={formData.epfemp}
                  readOnly
                  description="Calculated automatically based on PF rules"
                />
              </div>

              {/* ESIC Employee */}
              <div>
                <Input
                  label="ESIC Contribution (Employee)"
                  name="esicemp"
                  type="number"
                  value={formData.esicemp}
                  readOnly
                  description="Calculated automatically based on ESIC rules"
                />
              </div>

              {/* Professional Tax */}
              <div>
                <Input
                  label="Professional Tax"
                  name="pt"
                  type="number"
                  value={formData.pt}
                  readOnly
                  description="Calculated automatically based on professional tax slabs"
                />
              </div>

              {/* Net In Hand */}
              <div>
                <Input
                  label="Net In Hand Salary"
                  name="netinhand"
                  type="number"
                  value={formData.netinhand}
                  readOnly
                  className="font-bold text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-dark-800"
                  description="Gross minus EPF, ESIC, and Professional Tax"
                />
              </div>
            </div>

            {/* Invisible Benefits Employer Header */}
            <h4 className="text-sm font-bold text-gray-700 dark:text-dark-200 mt-8 mb-4 border-b border-gray-100 dark:border-dark-600 pb-1">
              Invisible Benefits by Employer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EPF Employer */}
              <div>
                <Input
                  label="PF Contribution (Employer)"
                  name="epfemployer"
                  type="number"
                  value={formData.epfemployer}
                  readOnly
                  description="Calculated automatically based on Employer PF rules"
                />
              </div>

              {/* ESIC Employer */}
              <div>
                <Input
                  label="ESIC Contribution (Employer)"
                  name="esicemployer"
                  type="number"
                  value={formData.esicemployer}
                  readOnly
                  description="Calculated automatically based on Employer ESIC rules"
                />
              </div>

              {/* Gross CTC Month */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 dark:border-dark-600 pt-6 mt-4">
                <div>
                  <Input
                    label="Gross CTC Per Month"
                    name="grossctcmonth"
                    type="number"
                    value={formData.grossctcmonth}
                    readOnly
                    className="font-bold bg-gray-50 dark:bg-dark-800"
                    description="Gross + PF Employer + ESIC Employer + Mobile Allowance"
                  />
                </div>

                {/* Gross CTC Annual */}
                <div>
                  <Input
                    label="Gross CTC Per Annual"
                    name="grossctcannual"
                    type="number"
                    value={formData.grossctcannual}
                    readOnly
                    className="font-bold text-success-600 dark:text-success-400 bg-gray-50 dark:bg-dark-800"
                    description="Monthly CTC * 12"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-150 dark:border-dark-500 pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => navigate("/dashboards/hrm/view-offer-letters-list")}
              className="px-6 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={submitting}
              className="px-8 font-semibold shadow-md shadow-primary-500/20"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>

        </form>
      </div>
    </Page>
  );
}
