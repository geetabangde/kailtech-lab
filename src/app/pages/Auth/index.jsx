// Import Dependencies
import { Link } from "react-router";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

// Local Imports
import { Card, Checkbox, Input, InputErrorMsg } from "components/ui";
import { schema } from "./schema";
import { Page } from "components/shared/Page";
import appLogo from "assets/logo.png";
import { useAuthContext } from "app/contexts/auth/context";
import { getFinancialYears } from "utils/financialYear";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState(null);
  const { login } = useAuthContext();
  const finYears = getFinancialYears();

  // ── Brute Force Mitigation State ──
  const [failedAttempts, setFailedAttempts] = useState(() =>
    Number(localStorage.getItem("login_failed_attempts") || 0),
  );
  const [lockoutTime, setLockoutTime] = useState(() =>
    Number(localStorage.getItem("login_lockout_until") || 0),
  );
  const [timeLeft, setTimeLeft] = useState(0);

  // Update cooldown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (lockoutTime > now) {
        setTimeLeft(Math.ceil((lockoutTime - now) / 1000));
      } else {
        if (timeLeft > 0) setTimeLeft(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTime, timeLeft]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      fiscalYear: finYears[0], // Default to current FY
    },
  });

  const onSubmit = async (data) => {
    if (timeLeft > 0) return;

    try {
      await login({
        username: data.username,
        password: data.password,
        finyear: data.fiscalYear,
      });

      // Reset on Success
      setFailedAttempts(0);
      setLockoutTime(0);
      localStorage.removeItem("login_failed_attempts");
      localStorage.removeItem("login_lockout_until");

      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get("redirect");
      const finalRedirect =
        redirect && redirect !== "null" && redirect !== "undefined"
          ? redirect
          : "/dashboards/home";
      navigate(finalRedirect, { replace: true });
    } catch (err) {
      // Increment failed attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem("login_failed_attempts", newAttempts);

      // Determine Lockout/Throttle time
      let waitDuration = 0;
      if (newAttempts >= 5)
        waitDuration = 30000; // 30s lockout
      else if (newAttempts === 4)
        waitDuration = 5000; // 5s throttle
      else if (newAttempts === 3) waitDuration = 2000; // 2s throttle

      if (waitDuration > 0) {
        const until = Date.now() + waitDuration;
        setLockoutTime(until);
        localStorage.setItem("login_lockout_until", until);
      }

      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.",
      );
    }
  };

  const isLocked = timeLeft > 0;

  return (
    <Page title="Login">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <div className="mt-4">
              <Link to="/">
                <img
                  src={appLogo}
                  alt="App Logo"
                  className="h-10 w-auto object-contain text-center"
                  style={{ marginLeft: "70px" }}
                />
              </Link>
              <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                Welcome Back
              </h2>
              <p className="dark:text-dark-300 text-gray-400">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="space-y-4">
                <Input
                  label="Username"
                  placeholder="Enter Username"
                  prefix={<EnvelopeIcon className="size-5" strokeWidth="1" />}
                  {...register("username")}
                  error={errors?.username?.message}
                  disabled={isLocked}
                />
                <Input
                  label="Password"
                  placeholder="Enter Password"
                  type="password"
                  prefix={<LockClosedIcon className="size-5" strokeWidth="1" />}
                  {...register("password")}
                  error={errors?.password?.message}
                  disabled={isLocked}
                />
              </div>

              <div className="mt-2">
                {isLocked ? (
                  <div className="rounded bg-red-50 p-2 text-center text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    Too many failed attempts. Please wait {timeLeft}s
                  </div>
                ) : (
                  <InputErrorMsg when={errorMessage}>
                    {errorMessage}
                  </InputErrorMsg>
                )}
              </div>

              <div className="mt-4">
                <label className="dark:text-dark-100 mb-1 block text-sm font-medium text-gray-700">
                  Select Financial Year
                </label>
                <select
                  disabled={isLocked}
                  className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-300 dark:bg-dark-600 dark:text-dark-100 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:opacity-60"
                  {...register("fiscalYear")}
                >
                  {finYears.map((fy) => (
                    <option key={fy} value={fy}>
                      FY {fy}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex items-center justify-between space-x-2">
                <Checkbox label="Remember me" disabled={isLocked} />
                <a
                  href="##"
                  className="dark:text-dark-300 dark:hover:text-dark-100 text-xs text-gray-400 hover:text-gray-800"
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="mt-5 w-full bg-primary-600 hover:bg-primary-700 rounded-md px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLocked}
              >
                {isLocked ? `Locked (${timeLeft}s)` : "Sign In"}
              </button>
            </form>
          </Card>
        </div>
      </main>
    </Page>
  );
}
