import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EditEmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prefix: "",
    firstname: "",
    middlename: "",
    lastname: "",
    prefixfather: "",
    fathersname: "",
    prefixmother: "",
    mothersname: "",
    prefixhusband: "",
    husbandname: "",
    joiningdate: "",
    gender: "",
    dob: "",
    localaddress: "",
    permanentaddress: "",
    marital: "",
    bloodgroup: "",
    mobile: "",
    email: "",
    aadharno: "",
    panno: "",
    esicno: "",
    pfno: "",
    uanno: "",
  });

  const [files, setFiles] = useState({
    thumb_image: null,
    sign_image: null,
  });

  const [previewImages, setPreviewImages] = useState({
    thumb_image: "",
    sign_image: "",
  });

  const [options, setOptions] = useState({
    gender: [],
    maritalstatus: [],
    bloodgroup: [],
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/hrm/get-employee-byid/${id}`);
        const result = response.data;

        if ((result.status === "true" || result.status === true) && result.data) {
          const d = result.data.employee || result.data;
          setFormData({
            prefix: d.prefix || "",
            firstname: d.firstname || "",
            middlename: d.middlename || "",
            lastname: d.lastname || "",
            prefixfather: d.prefixfather || "",
            fathersname: d.fathersname || "",
            prefixmother: d.prefixmother || "",
            mothersname: d.mothersname || "",
            prefixhusband: d.prefixhusband || "",
            husbandname: d.husbandname || "",
            joiningdate: d.joiningdate ? d.joiningdate.substring(0, 10) : "",
            gender: d.gender || "",
            dob: d.dob ? d.dob.substring(0, 10) : "",
            localaddress: d.localaddress || "",
            permanentaddress: d.permanentaddress || "",
            marital: d.marital || "",
            bloodgroup: d.bloodgroup || "",
            mobile: d.mobile || "",
            email: d.email || "",
            aadharno: d.aadharno || "",
            panno: d.panno || "",
            esicno: d.esicno || "",
            pfno: d.pfno || "",
            uanno: d.uanno || "",
          });
          setPreviewImages({
            thumb_image: d.thumb_image || "",
            sign_image: d.sign_image || "",
          });
          setOptions({
            gender: result.data.gender || [],
            maritalstatus: result.data.maritalstatus || [],
            bloodgroup: result.data.bloodgroup || [],
          });
        } else {
          toast.error(result.message || "Failed to load employee.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      setFiles((prev) => ({
        ...prev,
        [name]: selectedFiles[0],
      }));
      setPreviewImages((prev) => ({
        ...prev,
        [name]: URL.createObjectURL(selectedFiles[0]),
      }));
    }
  };

  const copyLocalToPermanent = () => {
    setFormData((prev) => ({
      ...prev,
      permanentaddress: prev.localaddress,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("employeeid", id); // Added employeeid to payload as expected by the backend
      Object.keys(formData).forEach((key) => {
        form.append(key, formData[key] !== null ? formData[key] : "");
      });
      if (files.thumb_image) form.append("thumb_image", files.thumb_image);
      if (files.sign_image) form.append("sign_image", files.sign_image);

      const response = await axios.post(`/hrm/update-employee/${id}`, form);
      const result = response.data;

      if (result.status === "true" || result.status === true) {
        toast.success(result.message || "Employee updated successfully ✅", {
          duration: 1000,
          icon: "✅",
        });
        navigate("/dashboards/hrm/manage-employee");
      } else {
        toast.error(result.message || "Failed to update employee ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Edit Employee Details">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Edit Employee Details
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/hrm/manage-employee")}
          >
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          {/* Row 1 */}
          <div className="grid grid-cols-12 gap-4 items-center">
             <label className="col-span-2 text-sm font-medium">First Name</label>
             <div className="col-span-1">
               <select name="prefix" value={formData.prefix} onChange={handleChange} className="w-full border rounded px-2 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                 <option value=""></option>
                 <option value="Mr.">Mr.</option>
                 <option value="Mrs.">Mrs.</option>
                 <option value="Miss">Miss</option>
               </select>
             </div>
             <div className="col-span-3">
               <Input name="firstname" value={formData.firstname} onChange={handleChange} placeholder="First name" required />
             </div>
             <div className="col-span-3">
               <Input name="middlename" value={formData.middlename} onChange={handleChange} placeholder="Middle Name" />
             </div>
             <div className="col-span-3">
               <Input name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Last name" required />
             </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Father&apos;s Name</label>
            <div className="col-span-1">
              <select name="prefixfather" value={formData.prefixfather} onChange={handleChange} className="w-full border rounded px-2 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                <option value=""></option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
              </select>
            </div>
            <div className="col-span-3">
              <Input name="fathersname" value={formData.fathersname} onChange={handleChange} />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Mother&apos;s Name</label>
            <div className="col-span-1">
              <select name="prefixmother" value={formData.prefixmother} onChange={handleChange} className="w-full border rounded px-2 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                <option value=""></option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
              </select>
            </div>
            <div className="col-span-3">
              <Input name="mothersname" value={formData.mothersname} onChange={handleChange} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Husband&apos;s/Wife&apos;s Name</label>
            <div className="col-span-1">
              <select name="prefixhusband" value={formData.prefixhusband} onChange={handleChange} className="w-full border rounded px-2 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                <option value=""></option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
              </select>
            </div>
            <div className="col-span-3">
              <Input name="husbandname" value={formData.husbandname} onChange={handleChange} />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Joining Date</label>
            <div className="col-span-4">
              <Input type="date" name="joiningdate" value={formData.joiningdate} onChange={handleChange} />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Gender</label>
            <div className="col-span-4">
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full border rounded px-3 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                <option value=""></option>
                {options.gender.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Date Of Birth</label>
            <div className="col-span-4">
              <Input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-12 gap-4 items-start">
             <label className="col-span-2 text-sm font-medium pt-2">Local Address</label>
             <div className="col-span-10">
               <textarea name="localaddress" value={formData.localaddress} onChange={handleChange} className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 min-h-[60px]" rows="2"></textarea>
             </div>
          </div>

          {/* Button Row */}
          <div className="grid grid-cols-12 gap-4 items-center -mt-2">
            <div className="col-span-2"></div>
            <div className="col-span-10">
              <Button type="button" onClick={copyLocalToPermanent} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-4 py-1 text-sm h-8">Same As above</Button>
            </div>
          </div>

          {/* Row 6 */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-2 text-sm font-medium pt-2">Permanent Address</label>
            <div className="col-span-10">
              <textarea name="permanentaddress" value={formData.permanentaddress} onChange={handleChange} className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 min-h-[60px]" rows="2"></textarea>
            </div>
          </div>

          {/* Row 7 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Marital Status</label>
            <div className="col-span-4">
              <select name="marital" value={formData.marital} onChange={handleChange} required className="w-full border rounded px-3 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                <option value=""></option>
                {options.maritalstatus.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Blood Group</label>
            <div className="col-span-4">
              <select name="bloodgroup" value={formData.bloodgroup} onChange={handleChange} className="w-full border rounded px-3 py-[7px] dark:bg-gray-800 dark:border-gray-700 text-sm">
                <option value=""></option>
                {options.bloodgroup.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 8 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Mobile</label>
            <div className="col-span-4">
              <Input name="mobile" value={formData.mobile} onChange={handleChange} required />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Email</label>
            <div className="col-span-4">
              <Input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          {/* Row 9 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">Aadhar Card No</label>
            <div className="col-span-4">
              <Input name="aadharno" value={formData.aadharno} onChange={handleChange} />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Pan Card No</label>
            <div className="col-span-4">
              <Input name="panno" value={formData.panno} onChange={handleChange} />
            </div>
          </div>

          {/* Row 10 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">ESIC No</label>
            <div className="col-span-4">
              <Input name="esicno" value={formData.esicno} onChange={handleChange} />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">PF No</label>
            <div className="col-span-4">
              <Input name="pfno" value={formData.pfno} onChange={handleChange} />
            </div>
          </div>

          {/* Row 11 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-2 text-sm font-medium">UAN No</label>
            <div className="col-span-4">
              <Input name="uanno" value={formData.uanno} onChange={handleChange} />
            </div>
            <label className="col-span-2 text-sm font-medium pl-2">Photo</label>
            <div className="col-span-2">
              <input type="file" name="thumb_image" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-100 hover:file:bg-gray-200" />
            </div>
            <div className="col-span-2">
              {previewImages.thumb_image && (
                <img src={previewImages.thumb_image} alt="Thumb" className="w-16 h-16 object-cover border rounded" />
              )}
            </div>
          </div>

          {/* Row 12 */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-6"></div>
            <label className="col-span-2 text-sm font-medium pl-2">Signature</label>
            <div className="col-span-2">
              <input type="file" name="sign_image" onChange={handleFileChange} accept=".jpg, .jpeg, .png, .gif" className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-100 hover:file:bg-gray-200" />
            </div>
            <div className="col-span-2">
              {previewImages.sign_image && (
                <img src={previewImages.sign_image} alt="Sign" className="w-24 h-8 object-contain border rounded" />
              )}
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Button type="submit" color="primary" disabled={loading} className="px-6 bg-[#007bff] hover:bg-blue-600 text-white border-blue-500">
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
