import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Mail } from "lucide-react";

const ISLANDS = [
  { value: "Kauai", label: "Kauaʻi", emoji: "🌿", status: "fully launched!" },
  { value: "Oahu", label: "Oʻahu", emoji: "🌺", status: "launching mid-summer" },
  { value: "Maui", label: "Maui", emoji: "🌊", status: "launching August" },
  { value: "Big Island", label: "Hawaiʻi Island", emoji: "🌋", status: "launching September" },
];

const ROLES = [
  { value: "driver", emoji: "🚗", label: "driver", desc: "Share rides you're already making and earn money helping your neighbors get around." },
  { value: "rider", emoji: "🙋", label: "rider", desc: "Find affordable rides from local drivers already heading your way. $5–$30 per ride." },
  { value: "both", emoji: "🤙", label: "both", desc: "Drive when you can, ride when you need to. Most members do both!" },
];

const TOTAL_STEPS = 4;

export default function JoinPage() {
  const [step, setStep] = useState(0); // 0=role, 1=info, 2=island, 3=signup
  const [role, setRole] = useState(null);
  const [island, setIsland] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  // OTP state: null = not yet, "sent" = waiting for code, "verified" = done
  const [otpState, setOtpState] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResending, setOtpResending] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const canContinue = () => {
    if (step === 0) return !!role;
    if (step === 1) return true;
    if (step === 2) return !!island;
    return false;
  };

  const resetOtp = () => {
    setOtpState(null);
    setOtpCode("");
    setOtpError("");
  };

  const handleSignup = async () => {
    setSignupError("");
    if (!email || !password || !confirmPassword) {
      setSignupError("please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setSignupError("password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setSignupError("passwords don't match.");
      return;
    }
    setSignupLoading(true);
    try {
      await base44.auth.register({ email, password });
      setOtpState("sent");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        // Account exists — send a new OTP so they can verify their existing account
        try {
          await base44.auth.resendOtp(email);
          setOtpState("sent");
        } catch (resendErr) {
          setSignupError("this email is already registered. try logging in instead.");
        }
      } else {
        setSignupError(msg || "something went wrong. please try again.");
      }
    }
    setSignupLoading(false);
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    if (!otpCode || otpCode.length < 4) {
      setOtpError("please enter the verification code from your email.");
      return;
    }
    setOtpLoading(true);
    try {
      await base44.auth.verifyOtp({ email, otpCode });
      // Try to auto-login (works for new registrations where we have the password)
      try {
        await base44.auth.loginViaEmailPassword(email, password);
        const driverRole = role === "driver" || role === "both" ? "driver" : "rider";
        window.location.href = `/account?setup=true&role=${driverRole}&island=${island}`;
        return;
      } catch (loginErr) {
        // Auto-login failed (likely existing user with different password)
        // Send them to platform login — their account is now verified so it'll work
      }
      const driverRole = role === "driver" || role === "both" ? "driver" : "rider";
      const params = new URLSearchParams({ setup: "true", role: driverRole, island });
      base44.auth.redirectToLogin(`/account?${params.toString()}`);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "";
      setOtpError(msg || "invalid code. please try again.");
    }
    setOtpLoading(false);
  };

  const handleResendOtp = async () => {
    setOtpResending(true);
    setOtpError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (e) {
      setOtpError("couldn't resend. please try again.");
    }
    setOtpResending(false);
  };

  const handleGoToLogin = () => {
    const driverRole = role === "driver" || role === "both" ? "driver" : "rider";
    const params = new URLSearchParams({ setup: "true", role: driverRole, island });
    base44.auth.redirectToLogin(`/account?${params.toString()}`);
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS - 1) {
      resetOtp();
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Minimal header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise logo"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <button
          onClick={() => base44.auth.redirectToLogin(`${window.location.origin}/trips`)}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          already have an account? log in
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold tracking-widest uppercase text-primary">
            step {step + 1} of {TOTAL_STEPS}
          </p>
          {step < 3 && (
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="bg-primary hover:bg-primary/90 text-white rounded-full font-bold px-4 py-1.5 text-xs h-auto disabled:opacity-40"
            >
              continue <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          )}
        </div>

        {/* STEP 0: Role */}
        {step === 0 && (
          <div className="space-y-6 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">welcome! 🌺</h1>
              <p className="text-gray-500 text-base">are you signing up as a driver, rider, or both?</p>
            </div>
            <div className="grid gap-3">
              {ROLES.map(({ value, emoji, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setRole(value)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    role === value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-gray-50 hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl shrink-0">{emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base">{label}</p>
                    <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  {role === value && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Info */}
        {step === 1 && (
          <div className="space-y-6 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">great choice! 🤙</h1>
              <p className="text-gray-500 text-base">next, you'll create your account with your email.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-green-900 text-base">what happens next:</p>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex gap-2"><span>1️⃣</span><span>create your account — takes 30 seconds</span></li>
                <li className="flex gap-2"><span>2️⃣</span><span>verify your email with a quick code we send you</span></li>
                <li className="flex gap-2"><span>3️⃣</span><span>fill out a short profile — about 2 minutes</span></li>
                <li className="flex gap-2"><span>4️⃣</span><span>once approved, you can book or post rides!</span></li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Island */}
        {step === 2 && (
          <div className="space-y-6 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">which island are you on?</h1>
              <p className="text-gray-500 text-base">we'll connect you with the right community.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ISLANDS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIsland(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                    island === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-bold">{opt.label}</span>
                  <span className="text-xs text-gray-400 font-normal text-center leading-tight">{opt.status}</span>
                  {island === opt.value && (
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-1">
                      <span className="text-white text-xs font-bold">✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Signup (before OTP) */}
        {step === 3 && !otpState && (
          <div className="space-y-5 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">create your account 🎉</h1>
              <p className="text-gray-500 text-base">enter your email and a password to get started.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="rounded-xl h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">confirm password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="re-enter password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="rounded-xl h-12 pr-10"
                    onKeyDown={e => e.key === "Enter" && handleSignup()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {signupError && (
                <p className="text-red-500 text-sm font-medium">{signupError}</p>
              )}
              <p className="text-sm text-gray-400 pt-2">
                forgot your password?{" "}
                <a href="/forgot-password" className="text-primary underline font-medium hover:text-primary/80">
                  reset it here
                </a>
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: OTP Verification */}
        {step === 3 && otpState === "sent" && (
          <div className="space-y-5 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">check your email 📧</h1>
              <p className="text-gray-500 text-base">
                we sent a verification code to <strong>{email}</strong>. enter it below.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                can't find the email? check your spam folder or{" "}
                <button onClick={handleResendOtp} disabled={otpResending} className="underline font-semibold hover:text-blue-600">
                  {otpResending ? "sending..." : "resend code"}
                </button>
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">verification code</label>
              <Input
                type="text"
                placeholder="6-digit code"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="rounded-xl h-14 text-center text-2xl tracking-[0.5em] font-bold"
                maxLength={6}
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
              />
            </div>
            {otpError && (
              <p className="text-red-500 text-sm font-medium">{otpError}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-8">
          {step > 0 && !otpState && (
            <Button
              variant="outline"
              onClick={() => { resetOtp(); setStep(step - 1); }}
              className="rounded-full px-6 border-gray-300 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> back
            </Button>
          )}
          {step < 3 && (
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
            >
              continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 3 && !otpState && (
            <Button
              onClick={handleSignup}
              disabled={signupLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
            >
              {signupLoading ? "creating account..." : "create my account →"}
            </Button>
          )}
          {step === 3 && otpState === "sent" && (
            <Button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpCode.length < 4}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
            >
              {otpLoading ? "verifying..." : "verify & continue →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}