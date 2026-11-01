import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Mail } from "lucide-react";
import { checkEmailExists } from "@/functions/checkEmailExists";
import WelcomeIntroCard from "@/components/signup/WelcomeIntroCard";

// Signup phases: "signup" → "otp" → "loginRetry" → "phone" → "done"
// Login mode is separate (toggled by the user).

export default function JoinPage() {
  const [phase, setPhase] = useState("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);

  // OTP state
  const [otpState, setOtpState] = useState(null); // null | "sent"
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResending, setOtpResending] = useState(false);

  // Login retry — shown when auto-login fails after OTP verification
  const [loginRetry, setLoginRetry] = useState(false);
  const [loginRetryPassword, setLoginRetryPassword] = useState("");
  const [loginRetryError, setLoginRetryError] = useState("");
  const [loginRetryLoading, setLoginRetryLoading] = useState(false);

  // In-app login mode
  const [loginMode, setLoginMode] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isLogin = params.get("login") === "true";
    if (isLogin) setLoginMode(true);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, otpState, loginRetry]);

  const resetOtp = () => {
    setOtpState(null);
    setOtpCode("");
    setOtpError("");
  };

  const withTimeout = (promise, ms) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

  const handleSignup = async () => {
    setSignupError("");
    if (!email || !password || !confirmPassword) {
      setSignupError("please fill in all fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSignupError("please enter a valid email address.");
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
    if (!tosAgreed) {
      setSignupError("please agree to the Terms of Service to continue.");
      return;
    }
    setSignupLoading(true);

    try {
      const check = await withTimeout(checkEmailExists({ email }), 8000);
      if (check?.exists) {
        setSignupError("this email is already registered. log in with your password below 👇");
        setLoginPassword(password);
        setLoginMode(true);
        setSignupLoading(false);
        return;
      }
    } catch (e) { /* fall through to register */ }

    try {
      await withTimeout(base44.auth.register({ email, password }), 20000);
      setOtpState("sent");
      setSignupError("");
    } catch (e) {
      if (e?.message === "timeout") {
        setSignupError("this is taking too long. please check your connection and try again in a moment.");
        setSignupLoading(false);
        return;
      }
      const msg = e?.response?.data?.message || e?.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        setSignupError("this email is already registered. log in with your password below 👇");
        setLoginMode(true);
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
      try {
        const otpLoginRes = await fetch(`${appParams.serverUrl}/api/apps/${appParams.appId}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-App-Id": appParams.appId },
          body: JSON.stringify({ email, password }),
        });
        if (!otpLoginRes.ok) throw new Error("login failed");
        const otpLoginData = await otpLoginRes.json();
        if (otpLoginData.access_token) {
          localStorage.setItem('base44_access_token', otpLoginData.access_token);
          base44.auth.setToken(otpLoginData.access_token);
        }
        try { await base44.auth.updateMe({ has_verified_otp: true }); } catch (e) {}
        setPhase("welcome");
      } catch (loginErr) {
        setLoginRetry(true);
        setLoginRetryError("almost there! your email is verified. enter your password to log in.");
      }
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
      const msg = e?.response?.data?.message || e?.message || "";
      setOtpError(msg ? `couldn't resend: ${msg}` : "couldn't resend. please try again in a moment.");
    }
    setOtpResending(false);
  };

  const handleLoginRetry = async () => {
    setLoginRetryError("");
    if (!loginRetryPassword) {
      setLoginRetryError("please enter your password.");
      return;
    }
    setLoginRetryLoading(true);
    try {
      const retryRes = await fetch(`${appParams.serverUrl}/api/apps/${appParams.appId}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Id": appParams.appId },
        body: JSON.stringify({ email, password: loginRetryPassword }),
      });
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({}));
        const msg = errData?.message || errData?.detail || "";
        if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("credential")) {
          setLoginRetryError("that password didn't match. try again, or use \"forgot password\" below.");
        } else {
          setLoginRetryError("couldn't log in. try again, or go to cruisehi.org and log in directly.");
        }
        setLoginRetryLoading(false);
        return;
      }
      const retryData = await retryRes.json();
      if (retryData.access_token) {
        localStorage.setItem('base44_access_token', retryData.access_token);
        base44.auth.setToken(retryData.access_token);
      }
      try { await base44.auth.updateMe({ has_verified_otp: true }); } catch (e) {}
      setPhase("welcome");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "";
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("credential")) {
        setLoginRetryError("that password didn't match. try again, or use \"forgot password\" below.");
      } else {
        setLoginRetryError("couldn't log in. try again, or go to cruisehi.org and log in directly.");
      }
    }
    setLoginRetryLoading(false);
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!email || !loginPassword) {
      setLoginError("please enter your email and password.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError("please enter a valid email address.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch(`${appParams.serverUrl}/api/apps/${appParams.appId}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Id": appParams.appId },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.message || errData?.detail || "";
        const lower = (msg || "").toLowerCase();
        if (lower.includes("verif") || lower.includes("not confirmed") || lower.includes("unconfirmed")) {
          try {
            await base44.auth.resendOtp(email);
            setLoginMode(false);
            setOtpState("sent");
            setOtpError("");
            setSignupError("");
            setLoginLoading(false);
            return;
          } catch (e) { /* fall through */ }
        }
        if (lower.includes("password") || lower.includes("credential") || lower.includes("invalid") || lower.includes("not found")) {
          setLoginError("that email or password didn't match. try again or reset your password.");
        } else {
          setLoginError(msg || "couldn't log in. please try again.");
        }
        setLoginLoading(false);
        return;
      }
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('base44_access_token', data.access_token);
        base44.auth.setToken(data.access_token);
      }
      try {
        const me = await base44.auth.me();
        if (me && !me.has_verified_otp) {
          try {
            await base44.auth.resendOtp(email);
            setLoginMode(false);
            setOtpState("sent");
            setOtpError("");
            setSignupError("");
            setLoginLoading(false);
            return;
          } catch (e) { /* continue */ }
        }
        await base44.auth.updateMe({ has_verified_otp: true });
      } catch (e) {}
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      const target = next ? decodeURIComponent(next) : "/home";
      const sep = target.includes('?') ? '&' : '?';
      window.location.href = target + (data.access_token ? `${sep}access_token=${data.access_token}` : '');
    } catch (e) {
      setLoginError("couldn't log in. please try again.");
    }
    setLoginLoading(false);
  };

  // Welcome card → Account page, which shows the phone step and "you're all set!" cards
  const handleWelcomeContinue = () => {
    const token = localStorage.getItem('base44_access_token');
    window.location.href = "/account?setup=true" + (token ? `&access_token=${token}` : '');
  };

  // ── LOGIN MODE ──────────────────────────────────────────────────
  if (loginMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span />
          <button
            onClick={() => { setLoginMode(false); setOtpState(null); }}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
          >
            don't have an account? sign up
          </button>
        </div>
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">welcome back 🤙</h1>
          <p className="text-gray-500 text-base mb-6">log in to your cruise hawaiʻi account.</p>

          {signupError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 font-medium">{signupError}</p>
            </div>
          )}

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
                  placeholder="your password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="rounded-xl h-12 pr-10"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
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
            {loginError && (
              <p className="text-red-500 text-sm font-medium">{loginError}</p>
            )}
            <p className="text-sm text-gray-400">
              forgot your password?{" "}
              <a
                href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="text-primary underline font-medium hover:text-primary/80"
              >
                reset it here
              </a>
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loginLoading || !email || !loginPassword}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base mt-2 disabled:opacity-40"
          >
            {loginLoading ? "logging in..." : "log in →"}
          </Button>

          <p className="text-xs text-gray-400 text-center mt-6">
            having trouble logging in? email{" "}
            <a href="mailto:cruisekauai@gmail.com" className="text-primary underline">cruisekauai@gmail.com</a>
          </p>
          <p className="text-sm text-gray-500 text-center mt-4">
            need an account?{" "}
            <button
              onClick={() => { setLoginMode(false); setOtpState(null); }}
              className="text-primary underline font-semibold"
            >
              sign up here
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── WELCOME ─────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
        <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>
        <WelcomeIntroCard onContinue={handleWelcomeContinue} />
      </div>
    );
  }

  // ── SIGNUP + OTP (default) ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Minimal header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span />
        <button
          onClick={() => setLoginMode(true)}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          already have an account? log in
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* SIGNUP FORM (before OTP) */}
        {!otpState && !loginRetry && (
          <div className="space-y-5">
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
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={tosAgreed}
                  onChange={(e) => setTosAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-primary focus:ring-primary shrink-0"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{" "}
                  <a href="/termsofservice" target="_blank" className="text-primary underline font-medium">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacypolicy" target="_blank" className="text-primary underline font-medium">Privacy Policy</a>.
                </span>
              </label>
              <p className="text-sm text-gray-400 pt-2">
                forgot your password?{" "}
                <a href="/forgot-password" className="text-primary underline font-medium hover:text-primary/80">
                  reset it here
                </a>
              </p>
            </div>
          </div>
        )}

        {/* OTP VERIFICATION */}
        {otpState === "sent" && !loginRetry && (
          <div className="space-y-5">
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm text-amber-800">
                didn't get the email? check your spam folder, or{" "}
                <button
                  onClick={() => { setLoginMode(true); resetOtp(); }}
                  className="underline font-semibold hover:text-amber-600"
                >
                  try logging in instead
                </button>{" "}
                if you already have an account.
              </p>
            </div>
          </div>
        )}

        {/* LOGIN RETRY — shown when auto-login fails after OTP */}
        {loginRetry && (
          <div className="space-y-5">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">email verified! ✅</h1>
              <p className="text-gray-500 text-base">
                your email <strong>{email}</strong> is verified. enter your password to finish logging in.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-sm text-green-800">
                💡 tip: if you can't remember your password, you can{" "}
                <a href="/forgot-password" className="underline font-semibold hover:text-green-600">reset it here</a>.
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="your password"
                  value={loginRetryPassword}
                  onChange={e => setLoginRetryPassword(e.target.value)}
                  className="rounded-xl h-12 pr-10"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleLoginRetry()}
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
            {loginRetryError && (
              <p className="text-red-500 text-sm font-medium">{loginRetryError}</p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-8">
          {otpState === "sent" && !loginRetry && (
            <Button
              variant="outline"
              onClick={() => { resetOtp(); }}
              className="rounded-full px-6 border-gray-300 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> back
            </Button>
          )}
          {!otpState && !loginRetry && (
            <Button
              onClick={handleSignup}
              disabled={signupLoading || !tosAgreed}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
            >
              {signupLoading ? "creating account..." : "create my account →"}
            </Button>
          )}
          {otpState === "sent" && !loginRetry && (
            <Button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpCode.length < 4}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
            >
              {otpLoading ? "verifying..." : "verify & continue →"}
            </Button>
          )}
          {loginRetry && (
            <Button
              onClick={handleLoginRetry}
              disabled={loginRetryLoading || !loginRetryPassword}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
            >
              {loginRetryLoading ? "logging in..." : "log in →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}