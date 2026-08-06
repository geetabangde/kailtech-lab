// Import Dependencies
import { PhoneIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { HiPencil } from "react-icons/hi";
import axios from "utils/axios";

// Local Imports
import { PreviewImg } from "components/shared/PreviewImg";
import { Avatar, Button, Input, Upload } from "components/ui";

// ----------------------------------------------------------------------

export default function General() {
  const [avatar, setAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    mobile: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/profile");
        const data = res.data;
        setFormData({
          username: data.username || "",
          fullName: [data.prefix, data.firstname, data.lastname].filter(Boolean).join(" ") || "",
          email: data.email || "",
          mobile: data.mobile || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-3xl 2xl:max-w-5xl">
      <h5 className="text-lg font-medium text-gray-800 dark:text-dark-50">
        General
      </h5>
      <p className="mt-0.5 text-balance text-sm text-gray-500 dark:text-dark-200">
        Update your account settings.
      </p>
      <div className="my-5 h-px bg-gray-200 dark:bg-dark-500" />
      <div className="mt-4 flex flex-col space-y-1.5">
        <span className="text-base font-medium text-gray-800 dark:text-dark-100">
          Avatar
        </span>
        <Avatar
          size={20}
          imgComponent={PreviewImg}
          imgProps={{ file: avatar }}
          src="/images/200x200.png"
          classNames={{
            root: "rounded-xl ring-primary-600 ring-offset-[3px] ring-offset-white transition-all hover:ring-3 dark:ring-primary-500 dark:ring-offset-dark-700",
            display: "rounded-xl",
          }}
          indicator={
            <div className="absolute bottom-0 right-0 -m-1 flex items-center justify-center rounded-full bg-white dark:bg-dark-700">
              {avatar ? (
                <Button
                  onClick={() => setAvatar(null)}
                  isIcon
                  className="size-6 rounded-full"
                >
                  <XMarkIcon className="size-4" />
                </Button>
              ) : (
                <Upload name="avatar" onChange={setAvatar} accept="image/*">
                  {({ ...props }) => (
                    <Button isIcon className="size-6 rounded-full" {...props}>
                      <HiPencil className="size-3.5" />
                    </Button>
                  )}
                </Upload>
              )}
            </div>
          }
        />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 [&_.prefix]:pointer-events-none">
        <Input
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter Nickname"
          label="Display name"
          className="rounded-xl"
          prefix={<UserIcon className="size-4.5" />}
          disabled={isLoading}
        />
        <Input
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter FullName"
          label="Full name"
          className="rounded-xl"
          prefix={<UserIcon className="size-4.5" />}
          disabled={isLoading}
        />
        <Input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter Email"
          label="Email"
          className="rounded-xl"
          prefix={<EnvelopeIcon className="size-4.5" />}
          disabled={isLoading}
        />
        <Input
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="Phone Number"
          label="Phone Number"
          className="rounded-xl"
          prefix={<PhoneIcon className="size-4.5" />}
          disabled={isLoading}
        />
      </div>

      <div className="mt-8 flex justify-end space-x-3 ">
        <Button className="min-w-[7rem]">Cancel</Button>
        <Button className="min-w-[7rem]" color="primary" disabled={isLoading}>
          Save
        </Button>
      </div>
    </div >
  );
}
