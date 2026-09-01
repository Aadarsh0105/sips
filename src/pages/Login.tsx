import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, LockIcon, MessageCircleIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { useData } from "../contexts/DataContext";
import { SchoolLogo } from "../components/shared/SchoolLogo";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Input";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { login, resendLoginOtp, resetOtp, verifyLoginOtp } from "../features/auth/authSlice";

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { settings } = useData();
  const authState = useAppSelector((state) => state.auth);
  const { loading, error, otpRequest } = authState;
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!otpRequest) return;
    setOtp(Array(6).fill(""));
    setSecondsLeft(otpRequest.expiresIn || 300);
    window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
  }, [otpRequest?.requestId]);

  useEffect(() => {
    if (!otpRequest || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [otpRequest, secondsLeft]);

  const redirectForRole = (role: string) => {
    navigate(role === "ADMIN" ? "/admin" : "/reception", { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpRequest) {
      const otpValue = otp.join("");
      if (otpValue.length !== 6) {
        toast.error("Please enter the complete 6-digit OTP.");
        return;
      }
      if (secondsLeft <= 0) {
        toast.error("OTP has expired. Please resend a new OTP.");
        return;
      }
      const resultAction = await dispatch(verifyLoginOtp({ requestId: otpRequest.requestId, otp: otpValue }));
      if (verifyLoginOtp.fulfilled.match(resultAction)) {
        toast.success("Signed in successfully.");
        redirectForRole(resultAction.payload.user.role);
        return;
      }
      toast.error((resultAction.payload as string) ?? "OTP verification failed.");
      return;
    }

    if (!mobile.trim() || !password.trim()) {
      toast.error("Please enter mobile number and password.");
      return;
    }

    const resultAction = await dispatch(login({ mobile: mobile.trim(), password }));
    if (login.fulfilled.match(resultAction)) {
      if ("otpRequired" in resultAction.payload) {
        toast.success("OTP sent to your WhatsApp number.");
        return;
      }
      toast.success("Signed in successfully.");
      redirectForRole(resultAction.payload.user.role);
      return;
    }

    toast.error((resultAction.payload as string) ?? "Login failed.");
  };

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] ?? ""));
    otpRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  };

  const resendOtp = async () => {
    if (!otpRequest) return;
    const resultAction = await dispatch(resendLoginOtp({ requestId: otpRequest.requestId }));
    if (resendLoginOtp.fulfilled.match(resultAction)) {
      setSecondsLeft(resultAction.payload.expiresIn || 300);
      setOtp(Array(6).fill(""));
      toast.success("A new OTP was sent on WhatsApp.");
      return;
    }
    toast.error((resultAction.payload as string) ?? "Unable to resend OTP.");
  };

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-900/50 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <SchoolLogo logo={settings.logo} name={settings.name} className="ring-2 ring-white/30" />
          <span className="font-display text-lg font-extrabold text-white">{settings.name}</span>
        </div>
        <div className="relative">
          <ShieldCheckIcon className="mb-5 h-12 w-12 text-brand-200" />
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white">
            Staff & Administration Portal
          </h2>
          <p className="mt-3 max-w-md text-brand-100">
            Manage students, collect fees, generate receipts, and track collections in one secure dashboard.
          </p>
        </div>
        <p className="relative text-sm text-brand-200">
          © {new Date().getFullYear()} {settings.name}
        </p>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back to Student Portal
          </Link>

          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <SchoolLogo logo={settings.logo} name={settings.name} />
            <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              {settings.name}
            </span>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {otpRequest ? "Verify your login" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {otpRequest
              ? `Enter the OTP sent on WhatsApp to ${otpRequest.maskedMobile}.`
              : "Sign in to your Admin or Receptionist account."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {!otpRequest ? <><Field label="Mobile Number" required>
              <Input
                autoFocus
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            </> : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
                  <MessageCircleIcon className="h-5 w-5 shrink-0" />
                  <span>OTP is valid for 5 minutes and was sent through WhatsApp.</span>
                </div>
                <Field label="6-digit OTP" required>
                  <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(element) => { otpRefs.current[index] = element; }}
                        aria-label={`OTP digit ${index + 1}`}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(event) => updateOtp(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        className="h-12 px-0 text-center text-lg font-bold"
                      />
                    ))}
                  </div>
                </Field>
                <div className="flex items-center justify-between text-sm">
                  <span className={secondsLeft > 0 ? "font-semibold text-slate-600 dark:text-slate-300" : "font-semibold text-rose-500"}>
                    {secondsLeft > 0 ? `Expires in ${formatTime(secondsLeft)}` : "OTP expired"}
                  </span>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading || secondsLeft > 0}
                    className="font-semibold text-brand-600 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-500/10">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              <LockIcon className="h-4 w-4" /> {loading ? "Please wait..." : otpRequest ? "Verify & Sign In" : "Sign In"}
            </Button>
            {otpRequest ? (
              <button
                type="button"
                onClick={() => dispatch(resetOtp())}
                className="w-full text-sm font-semibold text-slate-500 hover:text-brand-600"
              >
                Change mobile number or password
              </button>
            ) : null}
          </form>

          {/* <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Demo credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill("9876543211", "Rahul@123")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-500/10"
              >
                <span className="block font-semibold text-slate-700 dark:text-slate-200">
                  Receptionist
                </span>
                <span className="text-slate-400">9876543211 / Rahul@123</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("9999999999", "Admin@123")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-500/10"
              >
                <span className="block font-semibold text-slate-700 dark:text-slate-200">Admin</span>
                <span className="text-slate-400">9999999999 / Admin@123</span>
              </button>
            </div>
          </div> */}
        </motion.div>
      </div>
    </div>
  );
}
