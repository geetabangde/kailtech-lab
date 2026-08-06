// Import Dependencies
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import axios from "utils/axios";

// Local Imports
import { Avatar, AvatarDot, Button } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";

// ----------------------------------------------------------------------

export function Profile() {
  const { logout, user: authUser } = useAuthContext();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Use the detailed profile if available, otherwise fall back to the user object from AuthContext
  const displayData = profile || authUser;

  const fullName = displayData
    ? [displayData.prefix, displayData.firstname, displayData.lastname]
        .filter(Boolean)
        .join(" ") ||
      displayData.employee_name || // Support for PHP session style name
      displayData.name ||
      "User"
    : "";

  const designation = profile?.designation || "";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login?redirect=";
  };

  return (
    <Popover className="relative flex items-center gap-3">
      <Link 
        to="/settings/general"
        className="dark:text-dark-100 text-sm font-semibold text-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {fullName}
      </Link>
      <PopoverButton
        as={Avatar}
        size={9}
        role="button"
        src="/images/200x200.png"
        indicator={
          <AvatarDot
            color="success"
            className="-m-0.5 size-3 ltr:right-0 rtl:left-0"
          />
        }
        classNames={{
          root: "cursor-pointer",
        }}
      />
      <Transition
        enter="duration-200 ease-out"
        enterFrom="translate-y-2 opacity-0"
        enterTo="translate-y-0 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="translate-y-0 opacity-100"
        leaveTo="translate-y-2 opacity-0"
      >
        <PopoverPanel
          anchor={{ to: "bottom end", gap: 12 }}
          className="border-gray-150 shadow-soft dark:border-dark-600 dark:bg-dark-700 z-70 flex w-64 flex-col rounded-lg border bg-white transition dark:shadow-none"
        >
          {() => (
            <>
              <div className="dark:bg-dark-800 flex items-center gap-4 rounded-t-lg bg-gray-100 px-4 py-5">
                <Avatar size={14} src="/images/200x200.png" />
                <div>
                  <Link
                    className="hover:text-primary-600 focus:text-primary-600 dark:text-dark-100 dark:hover:text-primary-400 dark:focus:text-primary-400 text-base font-medium text-gray-700"
                    to="/settings/general"
                  >
                    {fullName}
                  </Link>

                  <p className="dark:text-dark-300 mt-0.5 text-xs text-gray-400">
                    {designation}
                  </p>
                </div>
              </div>
              <div className="flex flex-col pt-2 pb-5">
                <div className="px-4 pt-2">
                  <Button className="w-full gap-2" onClick={handleLogout}>
                    <ArrowLeftStartOnRectangleIcon className="size-4.5" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
